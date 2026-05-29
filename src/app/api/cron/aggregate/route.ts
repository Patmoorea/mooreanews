import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { aggregateAll } from "@/lib/aggregator";
import { expirePastAlerts } from "@/lib/alert-schedule";
import {
  checkFacebookTokenHealth,
  refreshFacebookUserTokenInProcess,
} from "@/lib/facebook-token";
import { purgeStaleFacebookImports } from "@/lib/facebook-import-cleanup";
import { checkFerryScheduleSync } from "@/lib/ferry-sync";
import { auditPublicContent } from "@/lib/site-content-audit";
import { notifyVeilleReport } from "@/lib/telegram-notify";
import { syncMeteoVigilanceAlert } from "@/lib/meteo-vigilance-sync";

/**
 * Endpoint d'agrégation RSS + Facebook, appelé par Vercel Cron (1×/jour, 18h Tahiti).
 * Protection :
 * - Vercel Cron envoie un header Authorization: Bearer ${CRON_SECRET}
 * - Sur un appel manuel, le secret peut être passé via ?secret=...
 */
export const dynamic = "force-dynamic";

async function verifyAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();

  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) return true;
    return false;
  }

  // Sans CRON_SECRET : accepter uniquement le cron Vercel (header officiel)
  if (req.headers.get("x-vercel-cron") === "1") return true;

  return process.env.NODE_ENV !== "production";
}

export async function GET(req: Request) {
  if (!(await verifyAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const fbRefresh = await refreshFacebookUserTokenInProcess();
  const expiredAlerts = await expirePastAlerts();
  if (expiredAlerts > 0) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }

  const meteoVigilance = await syncMeteoVigilanceAlert();
  const results = await aggregateAll();
  const duration = Date.now() - start;

  const alertsCreated = results.reduce(
    (s, r) => s + (r.alertsCreated ?? 0),
    0,
  );
  if (
    alertsCreated > 0 ||
    meteoVigilance.action === "created" ||
    meteoVigilance.action === "updated" ||
    meteoVigilance.action === "cleared"
  ) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }

  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
  const errors = results.flatMap((r) =>
    r.errors.map((e) => `${r.source}: ${e}`)
  );

  const articlesCreated = results.reduce(
    (s, r) => s + (r.articlesCreated ?? 0),
    0,
  );
  const articlesSkipped = results.reduce(
    (s, r) => s + (r.articlesSkipped ?? 0),
    0,
  );
  const eventsCreated = results.reduce(
    (s, r) => s + (r.eventsCreated ?? 0),
    0,
  );
  const announcementsCreated = results.reduce(
    (s, r) => s + (r.announcementsCreated ?? 0),
    0,
  );
  const createdArticles = results.flatMap((r) => r.createdArticles ?? []);
  const createdEvents = results.flatMap((r) => r.createdEvents ?? []);
  const createdAlertTitles = results.flatMap((r) => r.createdAlerts ?? []);

  const facebookPurge = await purgeStaleFacebookImports();
  if (facebookPurge.deleted > 0) {
    revalidatePath("/actualites");
    revalidatePath("/", "layout");
  }

  revalidatePath("/");
  revalidatePath("/api/ferries");

  const ferrySync = await checkFerryScheduleSync();

  const audit = await auditPublicContent();
  const facebookHealth = await checkFacebookTokenHealth();
  if (fbRefresh.refreshed) facebookHealth.refreshedThisRun = true;

  const telegram = await notifyVeilleReport({
    durationMs: duration,
    totalFetched,
    totalInserted,
    articlesCreated,
    articlesSkipped,
    eventsCreated,
    announcementsCreated,
    alertsCreated,
    expiredAlerts,
    createdAlertTitles,
    errors,
    bySource: results,
    createdArticles,
    createdEvents,
    audit,
    facebookHealth,
    facebookPurgeDeleted: facebookPurge.deleted,
  });

  const blockingErrors = errors.filter(
    (e) => !e.includes("CommuneMooreaMaiao"),
  );

  return NextResponse.json({
    ok: blockingErrors.length === 0,
    durationMs: duration,
    expiredAlerts,
    alertsCreated,
    meteoVigilance,
    telegram,
    audit: audit
      ? {
          findings: audit.findings.length,
          totals: audit.totals,
        }
      : null,
    totalFetched,
    totalInserted,
    articlesCreated,
    articlesSkipped,
    eventsCreated,
    announcementsCreated,
    ferrySync,
    errors,
    bySource: results,
  });
}

export const POST = GET;
