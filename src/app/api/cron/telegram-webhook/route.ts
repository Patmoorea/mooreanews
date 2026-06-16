import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { SITE } from "@/lib/constants";
import {
  getTelegramWebhookInfo,
  setTelegramWebhook,
} from "@/lib/telegram-api";
import { sendTestPublicChannelPost } from "@/lib/telegram-notify";
import {
  getPublicBotTokenStrict,
  getPublicBotUsername,
  getAdminBotToken,
} from "@/lib/telegram-config";

async function fetchWebhookInfo(token: string) {
  if (!token) return { ok: false as const, url: undefined, error: "no_token" };
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`,
    );
    const json = (await res.json()) as {
      ok?: boolean;
      result?: { url?: string; last_error_message?: string };
    };
    return {
      ok: Boolean(json.ok),
      url: json.result?.url,
      lastError: json.result?.last_error_message,
    };
  } catch (e) {
    return {
      ok: false as const,
      url: undefined,
      error: (e as Error).message,
    };
  }
}

/** Enregistre le webhook Telegram signalements (1× après deploy ou via cron). */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const publicToken = getPublicBotTokenStrict();
  const adminToken = getAdminBotToken();

  if (!publicToken) {
    return NextResponse.json(
      {
        ok: false,
        error: "TELEGRAM_PUBLIC_BOT_TOKEN manquant sur Vercel",
        hint: "Ajoutez le token @MooreanewsPublic_bot (BotFather), Redeploy, relancez ce curl.",
        bot: `@${getPublicBotUsername()}`,
      },
      { status: 400 },
    );
  }

  const base = SITE.url.replace(/\/$/, "");
  const webhookUrl = `${base}/api/webhooks/telegram`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const testChannel = new URL(req.url).searchParams.get("testChannel") === "1";

  const set = await setTelegramWebhook(webhookUrl, secret);
  const info = await getTelegramWebhookInfo();
  const adminHook = await fetchWebhookInfo(adminToken);
  const channelTest = testChannel ? await sendTestPublicChannelPost() : undefined;

  return NextResponse.json({
    ok: set.ok,
    webhookUrl,
    bot: `@${getPublicBotUsername()}`,
    publicTokenConfigured: true,
    secretConfigured: Boolean(secret),
    currentUrl: info.url,
    lastWebhookError: info.error,
    adminBotWebhookUrl: adminHook.url ?? null,
    channelTest,
    warning:
      adminHook.url === webhookUrl
        ? "Le bot ADMIN avait aussi ce webhook — normal si vous migrez. Le bot PUBLIC doit être celui utilisé par les citoyens."
        : undefined,
    error: set.error,
    next: testChannel
      ? "Vérifiez @MooreaNews — message test si channelTest.ok"
      : "Test canal : ajouter &testChannel=1 — puis t.me/MooreanewsPublic_bot → /start",
  });
}

export const POST = GET;
