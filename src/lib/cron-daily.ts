/**
 * Job cron quotidien complet (veille, digests, garde, audit, Telegram).
 * Planifié 16:05 UTC ≈ 6:05 heure de Tahiti.
 * Veille horaire : GitHub Actions → /api/cron/aggregate.
 */

import { revalidatePath } from "next/cache";
import { expirePastAlerts } from "@/lib/alert-schedule";
import { expireStaleAnnouncements } from "@/lib/announcement-expiry";
import { expirePastEvents } from "@/lib/event-expiry";
import {
  aggregateAll,
  type AggregationResult,
} from "@/lib/aggregator";
import {
  getTahitiClock,
  digestEmailsEnabled,
  shouldSendEveningDigest,
  shouldSendMorningDigest,
  shouldPublishGardeWeekend,
  shouldPublishWeeklyRecap,
  shouldSendWeekendDigest,
} from "@/lib/cron-tahiti";
import {
  deactivateFalseFerryAlerts,
  deactivateFalseHouleAlerts,
} from "@/lib/facebook-alert-import";
import { purgeStaleFacebookImports, purgeStaleFacebookEvents } from "@/lib/facebook-import-cleanup";
import {
  checkFacebookTokenHealth,
  refreshFacebookUserTokenInProcess,
} from "@/lib/facebook-token";
import { checkFerryScheduleSync } from "@/lib/ferry-sync";
import { sendMorningDigest } from "@/lib/morning-digest";
import {
  sendEveningDigestPush,
  sendMorningDigestPush,
  sendWeekendDigestPush,
} from "@/lib/push-notify";
import { syncMeteoVigilanceAlert } from "@/lib/meteo-vigilance-sync";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";
import { syncHealthOnCall } from "@/lib/health-on-call";
import { syncWeeklyRecapFromMooreaNews } from "@/lib/weekly-recap-sync";
import { checkDpamStatsFreshness } from "@/lib/maritime-traffic";
import { auditPublicContent } from "@/lib/site-content-audit";
import { notifyVeilleReport, sendPublicMooreaBrief } from "@/lib/telegram-notify";
import { sendWeekendDigest } from "@/lib/weekend-digest";
import { syncEmploymentMoorea } from "@/lib/employment-sync";

export type DailyCronResult = {
  ok: boolean;
  durationMs: number;
  tahiti: string;
  jobs: Record<string, unknown>;
  errors: string[];
};

/** Veille RSS/FB/web = GitHub horaire. Daily Vercel ne refait pas aggregateAll (timeout Hobby). */
function dailyRunsAggregateVeille(): boolean {
  return process.env.DAILY_AGGREGATE_VEILLE === "true";
}

export async function runDailyCron(): Promise<DailyCronResult> {
  const start = Date.now();
  const clock = getTahitiClock();
  const errors: string[] = [];
  const jobs: Record<string, unknown> = { tahiti: clock.label };

  const fbRefresh = await refreshFacebookUserTokenInProcess();
  jobs.facebookToken = { refreshed: fbRefresh.refreshed };

  const expiredAlerts = await expirePastAlerts();
  jobs.expiredAlerts = expiredAlerts;
  jobs.expiredAnnouncements = await expireStaleAnnouncements();
  jobs.expiredEvents = await expirePastEvents();
  if ((jobs.expiredEvents as number) > 0) {
    revalidatePath("/evenements");
    revalidatePath("/", "layout");
  }
  if (expiredAlerts > 0) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }

  jobs.meteoVigilance = await syncMeteoVigilanceAlert();
  if (
    jobs.meteoVigilance &&
    typeof jobs.meteoVigilance === "object" &&
    "action" in (jobs.meteoVigilance as object)
  ) {
    const action = (jobs.meteoVigilance as { action: string }).action;
    if (action === "created" || action === "updated" || action === "cleared") {
      revalidatePath("/alertes");
      revalidatePath("/", "layout");
    }
  }

  jobs.dpamStatsFreshness = await checkDpamStatsFreshness();
  revalidatePath("/trafic-ferry");

  if (shouldPublishWeeklyRecap(clock)) {
    jobs.weeklyRecap = await syncWeeklyRecapFromMooreaNews();
    revalidatePath("/actualites");
    revalidatePath("/", "layout");
  } else if (clock.weekday === 1) {
    jobs.weeklyRecap = {
      skipped: true,
      reason: "hors créneau lundi 5h–11h Tahiti (GitHub weekly-recap lundi)",
    };
  }

  if (shouldSendMorningDigest(clock)) {
    jobs.morningDigest = digestEmailsEnabled()
      ? await sendMorningDigest()
      : { skipped: true, reason: "digest email désactivé (newsletter dimanche seule)" };
    jobs.morningPush = await sendMorningDigestPush();
    jobs.publicTelegramBrief = await sendPublicMooreaBrief();
  } else {
    jobs.morningDigest = { skipped: true, reason: "hors créneau 7h Tahiti" };
    jobs.morningPush = { skipped: true, reason: "hors créneau 7h Tahiti" };
  }

  if (shouldSendEveningDigest(clock)) {
    jobs.eveningPush = await sendEveningDigestPush();
  } else {
    jobs.eveningPush = {
      skipped: true,
      reason: "hors créneau jeu–dim 16h–20h Tahiti (utiliser /api/cron/evening-push)",
    };
  }

  if (shouldSendWeekendDigest(clock)) {
    jobs.weekendDigest = digestEmailsEnabled()
      ? await sendWeekendDigest()
      : { skipped: true, reason: "digest email désactivé (newsletter dimanche seule)" };
    jobs.weekendPush = await sendWeekendDigestPush();
  } else {
    jobs.weekendDigest = {
      skipped: true,
      reason: "hors créneau vendredi matin Tahiti",
    };
    jobs.weekendPush = { skipped: true, reason: "hors créneau vendredi matin Tahiti" };
  }

  const employmentSync = await syncEmploymentMoorea();
  jobs.emploiFormation = employmentSync;
  const empChanged =
    employmentSync.sefi.jobsUpserted > 0 ||
    employmentSync.sefi.trainingsUpserted > 0 ||
    employmentSync.aravihi.upserted > 0 ||
    employmentSync.cgf.upserted > 0 ||
    employmentSync.commune.upserted > 0 ||
    employmentSync.expiredHidden > 0;
  if (empChanged) {
    revalidatePath("/emploi-formation");
  }
  errors.push(...employmentSync.errors);

  let results: AggregationResult[] = [];
  if (dailyRunsAggregateVeille()) {
    results = await aggregateAll();
    jobs.aggregate = {
      sources: results.length,
      inserted: results.reduce((s, r) => s + r.inserted, 0),
      alertsCreated: results.reduce((s, r) => s + (r.alertsCreated ?? 0), 0),
    };
  } else {
    jobs.aggregate = {
      skipped: true,
      reason: "veille horaire GitHub (rss → facebook → web → finish)",
    };
  }

  const alertsCreated = results.reduce(
    (s, r) => s + (r.alertsCreated ?? 0),
    0,
  );
  if (alertsCreated > 0) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }

  const articlesCreated = results.reduce(
    (s, r) => s + (r.articlesCreated ?? 0),
    0,
  );
  if (articlesCreated > 0) {
    revalidatePath("/actualites");
    revalidatePath("/", "layout");
  }

  jobs.utilityOutages = await syncUtilityOutages();
  jobs.healthOnCall = await syncHealthOnCall({
    fullWeekendPipeline: shouldPublishGardeWeekend(clock),
  });
  revalidatePath("/sante-garde");

  const utilitySync = jobs.utilityOutages as {
    created?: number;
    updated?: number;
    cleared?: number;
  };
  if (
    (utilitySync.created ?? 0) > 0 ||
    (utilitySync.updated ?? 0) > 0 ||
    (utilitySync.cleared ?? 0) > 0
  ) {
    revalidatePath("/alertes");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }

  const aggErrors = results.flatMap((r) =>
    r.errors.map((e) => `${r.source}: ${e}`),
  );
  errors.push(...aggErrors);

  const falseHouleAlerts = await deactivateFalseHouleAlerts();
  jobs.falseHouleAlertsDeactivated = falseHouleAlerts;
  const falseFerryAlerts = await deactivateFalseFerryAlerts();
  jobs.falseFerryAlertsDeactivated = falseFerryAlerts;
  if (falseHouleAlerts > 0 || falseFerryAlerts > 0) {
    revalidatePath("/");
    revalidatePath("/alertes");
  }

  const facebookPurge = await purgeStaleFacebookImports();
  jobs.facebookPurge = facebookPurge;
  const facebookEventsPurge = await purgeStaleFacebookEvents();
  jobs.facebookEventsPurge = facebookEventsPurge;
  if (facebookPurge.deleted > 0 || facebookEventsPurge.unpublished > 0) {
    revalidatePath("/actualites");
    revalidatePath("/evenements");
    revalidatePath("/", "layout");
  }

  revalidatePath("/");
  revalidatePath("/api/ferries");

  jobs.ferrySync = await checkFerryScheduleSync();

  if (dailyRunsAggregateVeille()) {
    jobs.audit = await auditPublicContent();
    const facebookHealth = await checkFacebookTokenHealth();
    if (fbRefresh.refreshed) facebookHealth.refreshedThisRun = true;

    jobs.telegram = await notifyVeilleReport({
      durationMs: Date.now() - start,
      totalFetched: results.reduce((s, r) => s + r.fetched, 0),
      totalInserted: results.reduce((s, r) => s + r.inserted, 0),
      articlesCreated: results.reduce(
        (s, r) => s + (r.articlesCreated ?? 0),
        0,
      ),
      articlesSkipped: results.reduce(
        (s, r) => s + (r.articlesSkipped ?? 0),
        0,
      ),
      eventsCreated: results.reduce(
        (s, r) => s + (r.eventsCreated ?? 0),
        0,
      ),
      announcementsCreated: results.reduce(
        (s, r) => s + (r.announcementsCreated ?? 0),
        0,
      ),
      alertsCreated,
      expiredAlerts,
      createdAlertTitles: results.flatMap((r) => r.createdAlerts ?? []),
      errors: aggErrors,
      bySource: results,
      createdArticles: results.flatMap((r) => r.createdArticles ?? []),
      createdEvents: results.flatMap((r) => r.createdEvents ?? []),
      audit: jobs.audit as Awaited<ReturnType<typeof auditPublicContent>>,
      facebookHealth,
      facebookPurgeDeleted: facebookPurge.deleted,
      headerNote: "Cron daily Vercel (veille complète)",
    });
  } else {
    jobs.audit = { skipped: true, reason: "audit via GitHub finish horaire" };
    jobs.telegram = {
      skipped: true,
      reason: "rapport veille via GitHub finish horaire",
    };
    jobs.facebookHealth = await checkFacebookTokenHealth();
  }

  const blockingErrors = errors.filter(
    (e) =>
      !e.includes("CommuneMooreaMaiao") &&
      !e.includes("Te Ito Rau") &&
      !e.includes("100088637945937") &&
      !e.includes("tntv.pf") &&
      !e.includes("pas de métadonnées OG") &&
      !e.includes("presidence.pf"),
  );

  return {
    ok: blockingErrors.length === 0,
    durationMs: Date.now() - start,
    tahiti: clock.label,
    jobs,
    errors,
  };
}
