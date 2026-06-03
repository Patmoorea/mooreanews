/**
 * Synchronise coupures EDT / eau → table alerts (sources officielles).
 */

import {
  getUtilityOutages,
  outageSyncFingerprint,
  type UtilityOutage,
} from "@/lib/utility-outages";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AlertRow } from "@/lib/supabase/types";

const SYNC_TAG_PREFIX = "<!--outage-sync:";

function detailsWithSyncTag(details: string | null, fingerprint: string): string {
  const base = details?.trim() ?? "";
  const tag = `${SYNC_TAG_PREFIX}${fingerprint}-->`;
  if (base.includes(SYNC_TAG_PREFIX)) {
    return base.replace(/<!--outage-sync:[^>]+-->/, tag);
  }
  return base ? `${base}\n${tag}` : tag;
}

function extractSyncFingerprint(details: string | null): string | null {
  if (!details) return null;
  const m = details.match(/<!--outage-sync:([^>]+)-->/);
  return m?.[1] ?? null;
}

export type UtilityOutagesSyncResult = {
  synced: boolean;
  edt: number;
  water: number;
  created: number;
  updated: number;
  cleared: number;
  error?: string;
};

async function listSyncedAlerts(): Promise<AlertRow[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const { data } = await admin
    .from("alerts")
    .select("*")
    .in("type", ["coupure_edt", "coupure_eau"])
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data ?? []).filter((a) =>
    a.details?.includes(SYNC_TAG_PREFIX),
  );
}

function alertPayload(outage: UtilityOutage, now: string) {
  const fp = outageSyncFingerprint(outage);
  return {
    type: outage.kind,
    severity: "warning" as const,
    title: outage.title.slice(0, 200),
    details: detailsWithSyncTag(outage.details, fp),
    district: outage.district,
    source_url: outage.sourceUrl,
    starts_at: null,
    ends_at: outage.endsAt,
    active: true,
    urgent: false,
    updated_at: now,
  };
}

/** Crée / met à jour / désactive les alertes coupures programmées Moorea. */
export async function syncUtilityOutages(): Promise<UtilityOutagesSyncResult> {
  const admin = getAdminSupabase();
  if (!admin) {
    return {
      synced: false,
      edt: 0,
      water: 0,
      created: 0,
      updated: 0,
      cleared: 0,
      error: "Supabase absent",
    };
  }

  let schedule;
  try {
    schedule = await getUtilityOutages();
  } catch (e) {
    return {
      synced: false,
      edt: 0,
      water: 0,
      created: 0,
      updated: 0,
      cleared: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const now = new Date().toISOString();
  const existing = await listSyncedAlerts();
  const byFp = new Map<string, AlertRow>();
  for (const row of existing) {
    const fp = extractSyncFingerprint(row.details);
    if (fp) byFp.set(fp, row);
  }

  const activeFps = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const outage of schedule.all) {
    const fp = outageSyncFingerprint(outage);
    activeFps.add(fp);
    const payload = alertPayload(outage, now);
    const prev = byFp.get(fp);

    if (prev) {
      const same =
        prev.title === payload.title &&
        prev.ends_at === payload.ends_at &&
        prev.district === payload.district &&
        extractSyncFingerprint(prev.details) === fp;
      if (same) continue;

      const { error } = await admin
        .from("alerts")
        .update(payload)
        .eq("id", prev.id);
      if (!error) updated += 1;
    } else {
      const { error } = await admin.from("alerts").insert({
        ...payload,
        created_at: now,
      });
      if (!error) created += 1;
    }
  }

  let cleared = 0;
  for (const row of existing) {
    const fp = extractSyncFingerprint(row.details);
    if (!fp || activeFps.has(fp)) continue;
    const { error } = await admin
      .from("alerts")
      .update({ active: false, updated_at: now })
      .eq("id", row.id);
    if (!error) cleared += 1;
  }

  return {
    synced: true,
    edt: schedule.edt.length,
    water: schedule.water.length,
    created,
    updated,
    cleared,
  };
}
