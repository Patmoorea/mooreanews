/**
 * Synchronise coupures EDT / eau → table alerts (sources officielles).
 */

import {
  clearUtilityOutagesCache,
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

function tahitiDateKey(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Pacific/Tahiti" });
}

/** Désactive les doublons actifs (même type + jour + secteur). */
async function dedupeActiveOutageAlerts(
  admin: NonNullable<ReturnType<typeof getAdminSupabase>>,
  now: string,
): Promise<number> {
  const { data } = await admin
    .from("alerts")
    .select("*")
    .in("type", ["coupure_edt", "coupure_eau"])
    .eq("active", true);

  if (!data?.length) return 0;

  const groups = new Map<string, AlertRow[]>();
  for (const row of data as AlertRow[]) {
    const day = row.ends_at?.slice(0, 10) ?? "unknown";
    const district = (row.district ?? "").toLowerCase().trim();
    const key = `${row.type}|${day}|${district}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  let removed = 0;
  for (const rows of groups.values()) {
    if (rows.length <= 1) continue;
    rows.sort(
      (a, b) =>
        Date.parse(b.updated_at ?? b.created_at) -
        Date.parse(a.updated_at ?? a.created_at),
    );
    for (const drop of rows.slice(1)) {
      const { error } = await admin
        .from("alerts")
        .update({ active: false, updated_at: now })
        .eq("id", drop.id);
      if (!error) removed += 1;
    }
  }
  return removed;
}

function alertPayload(outage: UtilityOutage, now: string) {
  const fp = outageSyncFingerprint(outage);
  const today = tahitiDateKey();
  const tomorrow = tahitiDateKey(new Date(Date.now() + 86400000));
  const outageDay = new Date(outage.startsAt).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
  const isSoon = outageDay === today || outageDay === tomorrow;

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
    urgent: isSoon,
    updated_at: now,
  };
}

const MIN_SYNC_INTERVAL_MS = 15 * 60 * 1000;
let lastSyncAt = 0;

/** Sync throttlé — accueil / alertes sans surcharger les sources. */
export async function syncUtilityOutagesIfStale(): Promise<
  UtilityOutagesSyncResult & { skipped?: boolean }
> {
  if (Date.now() - lastSyncAt < MIN_SYNC_INTERVAL_MS) {
    return {
      synced: false,
      skipped: true,
      edt: 0,
      water: 0,
      created: 0,
      updated: 0,
      cleared: 0,
    };
  }
  return syncUtilityOutages();
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

  clearUtilityOutagesCache();

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
        prev.urgent === payload.urgent &&
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

  lastSyncAt = Date.now();

  await dedupeActiveOutageAlerts(admin, now);

  return {
    synced: true,
    edt: schedule.edt.length,
    water: schedule.water.length,
    created,
    updated,
    cleared,
  };
}
