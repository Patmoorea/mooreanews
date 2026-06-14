/**
 * Veille en étapes (< 60 s chacune) pour Vercel Hobby + GitHub Actions.
 */

import { revalidatePath } from "next/cache";
import {
  aggregateRssOnly,
  aggregateWebPagesOnly,
  type AggregationResult,
} from "@/lib/aggregator";
import {
  getTahitiClock,
  shouldPublishGardeWeekend,
  shouldSyncGardeOnVeille,
} from "@/lib/cron-tahiti";
import { refreshFacebookUserTokenInProcess } from "@/lib/facebook-token";
import { syncHealthOnCall } from "@/lib/health-on-call";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";
import { notifyVeilleReport } from "@/lib/telegram-notify";
import { auditPublicContent } from "@/lib/site-content-audit";
import { checkFacebookTokenHealth } from "@/lib/facebook-token";

function summarize(bySource: AggregationResult[]) {
  return {
    totalFetched: bySource.reduce((s, r) => s + r.fetched, 0),
    totalInserted: bySource.reduce((s, r) => s + r.inserted, 0),
    articlesCreated: bySource.reduce((s, r) => s + (r.articlesCreated ?? 0), 0),
    articlesSkipped: bySource.reduce((s, r) => s + (r.articlesSkipped ?? 0), 0),
    articlesRepaired: bySource.reduce((s, r) => s + (r.articlesRepaired ?? 0), 0),
    eventsCreated: bySource.reduce((s, r) => s + (r.eventsCreated ?? 0), 0),
    announcementsCreated: bySource.reduce(
      (s, r) => s + (r.announcementsCreated ?? 0),
      0,
    ),
    alertsCreated: bySource.reduce((s, r) => s + (r.alertsCreated ?? 0), 0),
    errors: bySource.flatMap((r) => r.errors.map((e) => `${r.source}: ${e}`)),
    createdArticles: bySource.flatMap((r) => r.createdArticles ?? []),
    repairedArticles: bySource.flatMap((r) => r.repairedArticles ?? []),
    createdEvents: bySource.flatMap((r) => r.createdEvents ?? []),
  };
}

export async function runVeillePartRss() {
  const start = Date.now();
  await refreshFacebookUserTokenInProcess();
  const bySource = await aggregateRssOnly();
  const s = summarize(bySource);
  if (s.articlesCreated > 0) {
    revalidatePath("/actualites");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }
  if (s.alertsCreated > 0) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }
  return { ok: true, part: "rss" as const, durationMs: Date.now() - start, bySource, ...s };
}

export async function runVeillePartWeb() {
  const start = Date.now();
  const bySource = await aggregateWebPagesOnly();
  const s = summarize(bySource);
  if (s.articlesCreated > 0) {
    revalidatePath("/actualites");
    revalidatePath("/", "layout");
  }
  return { ok: true, part: "web" as const, durationMs: Date.now() - start, bySource, ...s };
}

export async function runVeillePartFinish() {
  const start = Date.now();
  const clock = getTahitiClock();
  const bySource: AggregationResult[] = [];

  const utilityOutages = await syncUtilityOutages();
  if (
    utilityOutages.created > 0 ||
    utilityOutages.updated > 0 ||
    utilityOutages.cleared > 0
  ) {
    revalidatePath("/alertes");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }

  let healthOnCall: Awaited<ReturnType<typeof syncHealthOnCall>> | {
    skipped: true;
    reason: string;
  };
  if (shouldSyncGardeOnVeille(clock)) {
    try {
      healthOnCall = await syncHealthOnCall({
        fullWeekendPipeline: shouldPublishGardeWeekend(clock),
      });
      if (healthOnCall.found) {
        revalidatePath("/sante-garde");
        revalidatePath("/actualites");
        revalidatePath("/", "layout");
      }
    } catch (e) {
      healthOnCall = {
        ok: false,
        found: false,
        pharmacy: null,
        doctor: null,
        articleSlug: null,
        ocrUsed: false,
        posterGenerated: false,
      };
      bySource.push({
        source: "garde",
        fetched: 0,
        matched: 0,
        inserted: 0,
        errors: [`garde: ${String(e)}`],
      });
    }
  } else {
    healthOnCall = {
      skipped: true,
      reason: "hors créneau garde (jeu 17h – dim Tahiti)",
    };
  }

  const audit = await auditPublicContent();
  const facebookHealth = await checkFacebookTokenHealth();
  const durationMs = Date.now() - start;

  const telegram = await notifyVeilleReport({
    durationMs,
    totalFetched: 0,
    totalInserted: 0,
    articlesCreated: 0,
    articlesSkipped: 0,
    articlesRepaired: 0,
    eventsCreated: 0,
    announcementsCreated: 0,
    alertsCreated: 0,
    errors: bySource.flatMap((r) => r.errors),
    bySource,
    audit,
    facebookHealth,
    headerNote: "🔗 Veille chaînée GitHub : rss → facebook → web → finish",
  });

  return {
    ok: true,
    part: "finish" as const,
    durationMs,
    utilityOutages,
    healthOnCall,
    telegram,
    auditFindings: audit?.findings.length ?? 0,
  };
}
