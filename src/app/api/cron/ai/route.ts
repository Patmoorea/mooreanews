import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runAiVeilleProcessing } from "@/lib/ai-veille";
import { isAiVeilleEnabled, aiModel } from "@/lib/ai-moorea";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Agent IA Moorea — veille → brouillons articles + résumé Telegram.
 * GET /api/cron/ai?secret=...&wait=1
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isAiVeilleEnabled()) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "IA off sur Vercel — lancez npm run ai:moorea sur le Mac (Ollama)",
    });
  }

  const url = new URL(req.url);
  const isVercelCron = req.headers.get("x-vercel-cron") === "1";
  const wait =
    url.searchParams.get("wait") === "1" || isVercelCron;

  if (!wait) {
    return NextResponse.json({
      ok: false,
      error: "wait_required",
      hint: "Ajoutez wait=1 pour exécution synchrone (< 120 s)",
      model: aiModel(),
    });
  }

  try {
    const result = await runAiVeilleProcessing();
    if (result.draftsCreated > 0) {
      revalidatePath("/actualites");
      revalidatePath("/admin/articles");
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: message.slice(0, 500) },
      { status: 500 },
    );
  }
}

export const POST = GET;
