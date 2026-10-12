import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { SITE } from "@/lib/constants";
import { getAdminBotToken } from "@/lib/telegram-config";
import {
  handleAiDraftModerationUpdate,
  type AiDraftUpdate,
} from "@/lib/telegram-ai-drafts";
import { notifyPublicNewArticles } from "@/lib/telegram-notify";

/**
 * Webhook dédié au bot ADMIN @Mooreanews_bot (modération brouillons IA).
 *
 * Avant : le bot admin pointait sur /api/webhooks/telegram (bot public),
 * protégé par TELEGRAM_WEBHOOK_SECRET que le bot admin n’envoyait pas
 * → Telegram recevait 403 et /brouillons, boutons… n’arrivaient jamais.
 *
 * Secret : dérivé de CRON_SECRET (pas de nouvelle variable Vercel).
 * Enregistrement : GET /api/webhooks/telegram-admin?secret=CRON_SECRET&register=1
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function adminWebhookSecret(): string {
  const base = process.env.CRON_SECRET?.trim() ?? "";
  if (!base) return "";
  return createHash("sha256")
    .update(`${base}:telegram-admin-webhook`)
    .digest("hex")
    .slice(0, 48);
}

export async function POST(req: Request) {
  const expected = adminWebhookSecret();
  const header = req.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || header !== expected) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let update: AiDraftUpdate;
  try {
    update = (await req.json()) as AiDraftUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    await handleAiDraftModerationUpdate(update, {
      onPublished: async ({ slug, title }) => {
        revalidatePath("/actualites");
        revalidatePath(`/actualites/${slug}`);
        revalidatePath("/", "layout");
        await notifyPublicNewArticles([{ slug, title }]);
      },
    });
  } catch (err) {
    console.error("[webhooks/telegram-admin]", err);
  }
  // Toujours 200 : Telegram ne doit pas re-livrer en boucle.
  return NextResponse.json({ ok: true });
}

/** (Ré)enregistre le webhook du bot admin. Protégé par CRON_SECRET. */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const token = getAdminBotToken();
  const secret = adminWebhookSecret();
  if (!token || !secret) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN ou CRON_SECRET manquant" },
      { status: 400 },
    );
  }
  const url = new URL(req.url);
  const webhookUrl = `${SITE.url.replace(/\/$/, "")}/api/webhooks/telegram-admin`;
  const api = (m: string, body?: Record<string, unknown>) =>
    fetch(`https://api.telegram.org/bot${token}/${m}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    }).then((r) => r.json());

  let set: unknown = null;
  if (url.searchParams.get("register") === "1") {
    set = await api("setWebhook", {
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: url.searchParams.get("dropPending") === "1",
    });
    await api("setMyCommands", {
      commands: [
        { command: "brouillons", description: "Brouillons IA en attente" },
        { command: "publier", description: "Publier un brouillon (slug)" },
        { command: "rejeter", description: "Rejeter un brouillon (slug)" },
        { command: "aide_ia", description: "Aide modération IA" },
      ],
    });
  }
  const info = (await api("getWebhookInfo")) as {
    result?: { url?: string; last_error_message?: string; pending_update_count?: number };
  };
  return NextResponse.json({
    ok: true,
    webhookUrl,
    set,
    current: info.result?.url,
    lastError: info.result?.last_error_message ?? null,
    pending: info.result?.pending_update_count ?? 0,
  });
}
