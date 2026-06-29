import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getTahitiClock, shouldSyncGardeOnVeille } from "@/lib/cron-tahiti";
import { syncHealthOnCall } from "@/lib/health-on-call";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";
import { COPPF_MEDECINS_GARDE_URL } from "@/lib/garde-ordre-pharmaciens";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function notifyGardeGap(result: Awaited<ReturnType<typeof syncHealthOnCall>>) {
  if (result.found && result.doctor) return;
  const lines = [
    "<b>⚠️ Garde week-end — sync incomplète</b>",
    "",
    result.found
      ? "Affiche trouvée mais médecin non extrait (OCR ?)."
      : "Aucune affiche garde détectée (COPPF / Commune).",
    "",
    `Pharmacie : ${escapeHtml(result.pharmacy ?? "—")}`,
    `Médecin : ${escapeHtml(result.doctor ?? "—")}`,
    result.ocrError ? `OCR : ${escapeHtml(result.ocrError)}` : "",
    "",
    `<a href="${COPPF_MEDECINS_GARDE_URL}">COPPF — médecins de garde</a>`,
    `<a href="https://www.mooreanews.com/admin">Admin MooreaNews</a>`,
  ].filter(Boolean);
  await sendTelegramNotification(lines.join("\n"));
}

async function runGardeSync() {
  const result = await syncHealthOnCall({ fullWeekendPipeline: true });
  revalidatePath("/sante-garde");
  revalidatePath("/actualites");
  revalidatePath("/", "layout");
  if (!result.found || !result.doctor) {
    await notifyGardeGap(result).catch(() => {});
  }
  return result;
}

/**
 * Pipeline garde week-end : OCR affiche commune + COPPF + affiche MooreaNews.
 *
 * Par défaut répond tout de suite (202) — l'OCR dure ~60–120 s et casse curl HTTP/2.
 * Ajouter `wait=1` pour attendre le JSON complet, ou `curl --http1.1 --max-time 300`.
 */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  const wait = url.searchParams.get("wait") === "1";
  const clock = getTahitiClock();

  if (!force && !shouldSyncGardeOnVeille(clock)) {
    return NextResponse.json({
      skipped: true,
      reason: "hors créneau garde (jeu 17h – dim Tahiti)",
      tahiti: clock.label,
    });
  }

  if (!wait) {
    after(async () => {
      try {
        await runGardeSync();
      } catch (err) {
        console.error("[garde-weekend cron async]", err);
      }
    });

    return NextResponse.json(
      {
        ok: true,
        started: true,
        async: true,
        tahiti: clock.label,
        forced: force,
        hint: "OCR en cours (~1–2 min). Vérifier /api/health-on-call ou relancer avec wait=1 et curl --http1.1 --max-time 300",
      },
      { status: 202 },
    );
  }

  try {
    const result = await runGardeSync();
    return NextResponse.json({
      tahiti: clock.label,
      forced: force,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[garde-weekend cron]", message);
    return NextResponse.json(
      { ok: false, error: message.slice(0, 500), tahiti: clock.label, forced: force },
      { status: 500 },
    );
  }
}

export const POST = GET;
