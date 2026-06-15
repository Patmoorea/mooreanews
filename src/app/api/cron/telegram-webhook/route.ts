import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { SITE } from "@/lib/constants";
import {
  getTelegramWebhookInfo,
  setTelegramWebhook,
} from "@/lib/telegram-api";
import { getPublicBotUsername } from "@/lib/telegram-config";

/** Enregistre le webhook Telegram signalements (1× après deploy ou via cron). */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const base = SITE.url.replace(/\/$/, "");
  const webhookUrl = `${base}/api/webhooks/telegram`;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();

  const set = await setTelegramWebhook(webhookUrl, secret);
  const info = await getTelegramWebhookInfo();

  return NextResponse.json({
    ok: set.ok,
    webhookUrl,
    bot: `@${getPublicBotUsername()}`,
    secretConfigured: Boolean(secret),
    currentUrl: info.url,
    error: set.error,
    hint: "Webhook enregistré sur le bot public (TELEGRAM_PUBLIC_BOT_TOKEN). Admin : TELEGRAM_BOT_TOKEN séparé.",
  });
}

export const POST = GET;
