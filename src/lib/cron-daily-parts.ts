/**
 * Étapes du cron daily — une requête HTTP par part (< 60 s Hobby, GitHub enchaîne).
 */

import { revalidatePath } from "next/cache";
import { expirePastAlerts } from "@/lib/alert-schedule";
import { expireStaleAnnouncements } from "@/lib/announcement-expiry";
import { expirePastEvents } from "@/lib/event-expiry";
import { aggregateRssOnly, aggregateWebPagesOnly } from "@/lib/aggregator";
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
import {
  purgeStaleFacebookImports,
  purgeStaleFacebookEvents,
} from "@/lib/facebook-import-cleanup";
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
import {
  aggregateFacebookWatchUrls,
  aggregateFacebookPagesGraph,
} from "@/lib/facebook-watch";
import { facebookCronRecentPostLimit } from "@/lib/facebook-import-filters";
import { getFacebookImportStatus } from "@/lib/facebook-import-status";
import type { AggregationResult } from "@/lib/aggregator";

export type DailyCronResult = {
  ok: boolean;
  durationMs: number;
  tahiti: string;
  jobs: Record<string, unknown>;
  errors: string[];
};

export const DAILY_CRON_PARTS = [
  "maintenance",
  "digests",
  "employment",
  "aggregate-rss",
  "aggregate-facebook",
  "aggregate-web",
  "services",
  "cleanup",
  "telegram",
] as const;

export type DailyCronPart = (typeof DAILY_CRON_PARTS)[number];

function blockingErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes("CommuneMooreaMaiao") &&
      !e.includes("Te Ito Rau") &&
      !e.includes("100088637945937") &&
      !e.includes("tntv.pf") &&
      !e.includes("pas de métadonnées OG") &&
      !e.includes("presidence.pf"),
  );
}

function emptyResult(part: DailyCronPart, start: number): DailyCronResult {
  const clock = getTahitiClock();
  return {
    ok: true,
    durationMs: Date.now() - start,
    tahiti: clock.label,
    jobs: { tahiti: clock.label, part },
    errors: [],
  };
}

function revalidateFromAggregation(results: AggregationResult[]): void {
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
}

function aggregationErrors(results: AggregationResult[]): string[] {
  return results.flatMap((r) => r.errors.map((e) => `${r.source}: ${e}`));
}

function summarizeAggregation(results: AggregationResult[]) {
  return {
    sources: results.length,
    inserted: results.reduce((s, r) => s + r.inserted, 0),
    alertsCreated: results.reduce((s, r) => s + (r.alertsCreated ?? 0), 0),
    articlesCreated: results.reduce((s, r) => s + (r.articlesCreated ?? 0), 0),
    totalFetched: results.reduce((s, r) => s + r.fetched, 0),
    totalInserted: results.reduce((s, r) => s + r.inserted, 0),
    articlesSkipped: results.reduce((s, r) => s + (r.articlesSkipped ?? 0), 0),
    eventsCreated: results.reduce((s, r) => s + (r.eventsCreated ?? 0), 0),
    announcementsCreated: results.reduce(
      (s, r) => s + (r.announcementsCreated ?? 0),
      0,
    ),
    createdArticles: results.flatMap((r) => r.createdArticles ?? []),
    createdEvents: results.flatMap((r) => r.createdEvents ?? []),
    createdAlertTitles: results.flatMap((r) => r.createdAlerts ?? []),
  };
}

export async function runDailyCronPart(
  part: DailyCronPart,
): Promise<DailyCronResult> {
  const start = Date.now();
  const clock = getTahitiClock();
  const errors: string[] = [];
  const jobs: Record<string, unknown> = { tahiti: clock.label, part };

  switch (part) {
    case "maintenance": {
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
      break;
    }

    case "digests": {
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
      break;
    }

    case "employment": {
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
      break;
    }

    case "aggregate-rss": {
      const results = await aggregateRssOnly();
      jobs.aggregateRss = summarizeAggregation(results);
      revalidateFromAggregation(results);
      errors.push(...aggregationErrors(results));
      break;
    }

    case "aggregate-facebook": {
      const recentLimit = Math.min(facebookCronRecentPostLimit(), 5);
      const results = await Promise.all([
        aggregateFacebookWatchUrls(),
        aggregateFacebookPagesGraph({
          light: true,
          recentImportLimit: recentLimit,
        }),
      ]);
      jobs.aggregateFacebook = summarizeAggregation(results);
      revalidateFromAggregation(results);
      errors.push(...aggregationErrors(results));
      break;
    }

    case "aggregate-web": {
      const results = await aggregateWebPagesOnly();
      jobs.aggregateWeb = summarizeAggregation(results);
      revalidateFromAggregation(results);
      errors.push(...aggregationErrors(results));
      break;
    }

    case "services": {
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
      break;
    }

    case "cleanup": {
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
      jobs.audit = await auditPublicContent();
      break;
    }

    case "telegram": {
      const expiredAlerts = await expirePastAlerts();
      const rssResults = await aggregateRssOnly();
      const summary = summarizeAggregation(rssResults);
      const aggErrors = aggregationErrors(rssResults);
      errors.push(...aggErrors);

      const fbRefresh = await refreshFacebookUserTokenInProcess();
      const facebookHealth = await checkFacebookTokenHealth();
      if (fbRefresh.refreshed) facebookHealth.refreshedThisRun = true;
      const facebookImportStatus = await getFacebookImportStatus();

      jobs.telegram = await notifyVeilleReport({
        durationMs: Date.now() - start,
        totalFetched: summary.totalFetched,
        totalInserted: summary.totalInserted,
        articlesCreated: summary.articlesCreated,
        articlesSkipped: summary.articlesSkipped,
        eventsCreated: summary.eventsCreated,
        announcementsCreated: summary.announcementsCreated,
        alertsCreated: summary.alertsCreated,
        expiredAlerts,
        createdAlertTitles: summary.createdAlertTitles,
        errors: aggErrors,
        bySource: rssResults,
        createdArticles: summary.createdArticles,
        createdEvents: summary.createdEvents,
        audit: await auditPublicContent(),
        facebookHealth,
        facebookImportStatus,
        headerNote: "Cron daily GitHub (~6h05 Tahiti) — rapport RSS + statut FB",
      });
      break;
    }

    default:
      return emptyResult(part, start);
  }

  return {
    ok: blockingErrors(errors).length === 0,
    durationMs: Date.now() - start,
    tahiti: clock.label,
    jobs,
    errors,
  };
}
