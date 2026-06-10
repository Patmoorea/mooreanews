/**
 * Veille horaire légère — RSS + Facebook uniquement (sans OCR, digests, Telegram…).
 * Appelée par GitHub Actions toutes les heures et /api/cron/aggregate.
 */

import { revalidatePath } from "next/cache";
import { aggregateAll } from "@/lib/aggregator";
import { refreshFacebookUserTokenInProcess } from "@/lib/facebook-token";
import { syncUtilityOutages } from "@/lib/utility-outages-sync";

export type VeilleCronResult = {
  ok: boolean;
  durationMs: number;
  totalFetched: number;
  totalInserted: number;
  articlesCreated: number;
  alertsCreated: number;
  utilityOutages: Awaited<ReturnType<typeof syncUtilityOutages>>;
  errors: string[];
  bySource: Awaited<ReturnType<typeof aggregateAll>>;
};

export async function runVeilleCron(): Promise<VeilleCronResult> {
  const start = Date.now();
  await refreshFacebookUserTokenInProcess();
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
    errors,
    bySource: results,
  };
}
