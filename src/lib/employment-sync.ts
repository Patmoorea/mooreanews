/**
 * Veille emploi & formation Moorea — toutes sources (cron quotidien).
 */

import { syncAravihiMooreaJobs } from "@/lib/aravihi-employment-sync";
import { syncCgfMooreaJobs } from "@/lib/cgf-employment-sync";
import { syncCommuneEmploymentRss } from "@/lib/commune-employment-sync";
import { syncSefiMooreaOpportunities } from "@/lib/sefi-sync";

export type EmploymentSyncResult = {
  sefi: Awaited<ReturnType<typeof syncSefiMooreaOpportunities>>;
  aravihi: { fetched: number; upserted: number; hidden: number };
  cgf: { fetched: number; upserted: number; hidden: number };
  commune: { fetched: number; upserted: number; hidden: number };
  errors: string[];
};

/** Synchronisation quotidienne de toutes les sources emploi/formation. */
export async function syncEmploymentMoorea(): Promise<EmploymentSyncResult> {
  const errors: string[] = [];

  const sefi = await syncSefiMooreaOpportunities();
  errors.push(...sefi.errors);

  let aravihi = { fetched: 0, upserted: 0, hidden: 0 };
  try {
    aravihi = await syncAravihiMooreaJobs();
  } catch (e) {
    errors.push(`aravihi: ${String(e)}`);
  }

  let cgf = { fetched: 0, upserted: 0, hidden: 0 };
  try {
    cgf = await syncCgfMooreaJobs();
  } catch (e) {
    errors.push(`cgf: ${String(e)}`);
  }

  let commune = { fetched: 0, upserted: 0, hidden: 0 };
  try {
    commune = await syncCommuneEmploymentRss();
  } catch (e) {
    errors.push(`commune: ${String(e)}`);
  }

  return { sefi, aravihi, cgf, commune, errors };
}
