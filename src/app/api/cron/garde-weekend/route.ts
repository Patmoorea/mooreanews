import { after, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyCronAuth } from "@/lib/cron-auth";
import { cleanupGardeData, PURGED_GARDE_SLUGS } from "@/lib/garde-cleanup";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getTahitiClock, shouldSyncGardeOnVeille } from "@/lib/cron-tahiti";
import { syncHealthOnCall } from "@/lib/health-on-call";
import { notifyGardeFailureOnce } from "@/lib/garde-alerts";
import { expectedWeekend } from "@/lib/garde-official-table";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Alerte Telegram si la synchro n'a rien publié — 1 seule par week-end et par cause,
 * avec la vraie raison (affiche pas encore publiée / OCR / validation / erreur).
 * NB : COPPF ne publie pas d'affiche « pharmacie Moorea » → pas d'alerte pharmacie.
 */
async function notifyGardeGap(result: Awaited<ReturnType<typeof syncHealthOnCall>>) {
  if (result.ok) return;
  const cause = result.cause ?? "erreur";
  const weekend = result.expected ?? expectedWeekend(new Date());
  const detail = result.validationIssues?.length
    ? result.validationIssues.join(" ; ")
    : result.ocrError;
  const sent = await notifyGardeFailureOnce({
    cause,
    weekendFrom: weekend.validFrom,
    weekendTo: weekend.validTo,
    detail,
  });
  console.log("[garde-weekend] alerte", cause, JSON.stringify(sent));
}

async function runGardeSync() {
  // Nettoyage côté Vercel pour pouvoir revalider les pages touchées (articles supprimés / corrigés).
  const admin = getAdminSupabase();
  if (admin) {
    const cleanup = await cleanupGardeData(admin).catch((e) => {
      console.error("[garde-cleanup]", e);
      return null;
    });
    if (cleanup) {
      console.log("[garde-cleanup]", JSON.stringify(cleanup));
      for (const slug of [...cleanup.touchedSlugs, ...PURGED_GARDE_SLUGS]) {
        revalidatePath(`/actualites/${slug}`);
      }
    }
  }
  const result = await syncHealthOnCall({ fullWeekendPipeline: true });
  revalidateTag("garde-moorea", "max");
  revalidatePath("/sante-garde");
  revalidatePath("/actualites");
  revalidatePath("/"); // accueil seulement (plus de purge de tout le site)
  if (result.articleSlug) {
    revalidatePath(`/actualites/${result.articleSlug}`);
  }
  if (!result.ok) {
    await notifyGardeGap(result).catch((e) => console.error("[garde-weekend] alerte", e));
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
    // ok:false (rien publié pour le week-end attendu) = 500 → le workflow GitHub passe au rouge.
    const httpStatus = result.ok ? 200 : 500;
    return NextResponse.json(
      {
        tahiti: clock.label,
        forced: force,
        ...result,
      },
      { status: httpStatus },
    );
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
