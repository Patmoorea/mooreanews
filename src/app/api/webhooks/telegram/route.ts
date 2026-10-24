import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { handleAiDraftModerationUpdate } from "@/lib/telegram-ai-drafts";
import { notifyPublicNewArticles } from "@/lib/telegram-notify";
import { scheduleSignalementAiEnrichment } from "@/lib/ai-signalement-enrich";
import {
  handleTelegramSignalementUpdate,
  type TelegramUpdate,
} from "@/lib/telegram-signalement-bot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Modération des brouillons IA (bot admin, chat TELEGRAM_CHAT_ID).
  try {
    const handledAi = await handleAiDraftModerationUpdate(update, {
      onPublished: async ({ slug, title }) => {
        revalidatePath("/actualites");
        revalidatePath(`/actualites/${slug}`);
        revalidatePath("/"); // accueil seulement (plus de purge de tout le site)
        await notifyPublicNewArticles([{ slug, title }]);
      },
    });
    if (handledAi) return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhooks/telegram] ai-drafts", err);
  }

  let aiEnrich: { submissionId: string; input: Parameters<typeof scheduleSignalementAiEnrichment>[1] } | undefined;

  try {
    const handled = await handleTelegramSignalementUpdate(update);
    aiEnrich = handled.aiEnrich;
  } catch (err) {
    console.error("[webhooks/telegram]", err);
  }

  if (aiEnrich?.submissionId) {
    scheduleSignalementAiEnrichment(aiEnrich.submissionId, aiEnrich.input);
  }

  return NextResponse.json({ ok: true });
}
