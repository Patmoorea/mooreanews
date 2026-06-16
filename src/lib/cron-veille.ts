/**
 * Veille horaire légère — RSS + Facebook + garde week-end (ven–dim).
 * Appelée par GitHub Actions toutes les heures et /api/cron/aggregate.
 */

import { revalidatePath } from "next/cache";
import { aggregateAll } from "@/lib/aggregator";
import {
  getTahitiClock,
  shouldPublishGardeWeekend,
  shouldSyncGardeOnVeille,
} from "@/lib/cron-tahiti";
import { ensureFacebookTokensInProcess } from "@/lib/facebook-token";
import { syncHealthOnCall } from "@/lib/health-on-call";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";

export type VeilleCronResult = {
  ok: boolean;
  durationMs: number;
  totalFetched: number;
  totalInserted: number;
  articlesCreated: number;
  alertsCreated: number;
  utilityOutages: Awaited<ReturnType<typeof syncUtilityOutages>>;
  healthOnCall?: Awaited<ReturnType<typeof syncHealthOnCall>> | { skipped: true; reason: string };
  errors: string[];
  bySource: Awaited<ReturnType<typeof aggregateAll>>;
};

export async function runVeilleCron(): Promise<VeilleCronResult> {
  const start = Date.now();
  const clock = getTahitiClock();
  await ensureFacebookTokensInProcess();
  const results = await aggregateAll();

  const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
  const totalInserted = results.reduce((s, r) => s + r.inserted, 0);
  const articlesCreated = results.reduce(
    (s, r) => s + (r.articlesCreated ?? 0),
    0,
  );
  const alertsCreated = results.reduce(
    (s, r) => s + (r.alertsCreated ?? 0),
    0,
  );

  const errors = results.flatMap((r) =>
    r.errors.map((e) => `${r.source}: ${e}`),
  );

  if (alertsCreated > 0) {
    revalidatePath("/alertes");
    revalidatePath("/", "layout");
  }
  if (articlesCreated > 0) {
    revalidatePath("/actualites");
    revalidatePath("/coupures");
    revalidatePath("/", "layout");
  }

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

  let healthOnCall: VeilleCronResult["healthOnCall"];
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
      errors.push(`garde: ${String(e)}`);
      healthOnCall = { ok: false, found: false, pharmacy: null, doctor: null, articleSlug: null, ocrUsed: false, posterGenerated: false };
    }
  } else {
    healthOnCall = { skipped: true, reason: "hors créneau garde (jeu 17h – dim Tahiti)" };
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
    totalFetched,
    totalInserted,
    articlesCreated,
    alertsCreated,
    utilityOutages,
    healthOnCall,
    errors,
    bySource: results,
  };
}
