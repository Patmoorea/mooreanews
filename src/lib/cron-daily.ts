/**
 * Job cron quotidien complet (veille, digests, garde, audit, Telegram).
 * Planifié ~6h05 Tahiti via GitHub Actions → `.github/workflows/cron-daily.yml`.
 * Veille horaire : GitHub Actions → `veille-hourly.yml`.
 */

export type { DailyCronResult, DailyCronPart } from "@/lib/cron-daily-parts";
export {
  DAILY_CRON_PARTS,
  runDailyCronPart,
} from "@/lib/cron-daily-parts";

import {
  DAILY_CRON_PARTS,
  runDailyCronPart,
  type DailyCronResult,
} from "@/lib/cron-daily-parts";

export async function runDailyCron(): Promise<DailyCronResult> {
  const start = Date.now();
  const mergedJobs: Record<string, unknown> = {};
  const mergedErrors: string[] = [];
  let tahiti = "";
  let ok = true;

  for (const part of DAILY_CRON_PARTS) {
    const result = await runDailyCronPart(part);
    tahiti = result.tahiti;
    ok = ok && result.ok;
    mergedErrors.push(...result.errors);
    Object.assign(mergedJobs, result.jobs);
  }

  return {
    ok,
    durationMs: Date.now() - start,
    tahiti,
    jobs: mergedJobs,
    errors: mergedErrors,
  };
}
