import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { SITE } from "@/lib/constants";
import {
  getTelegramWebhookInfo,
  setTelegramWebhook,
} from "@/lib/telegram-api";

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
    secretConfigured: Boolean(secret),
    currentUrl: info.url,
    error: set.error,
    hint: "Appelez cette URL après chaque deploy ou configurez TELEGRAM_WEBHOOK_SECRET sur Vercel.",
  });
}

export const POST = GET;
