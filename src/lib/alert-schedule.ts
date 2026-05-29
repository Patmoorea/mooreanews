/**
 * Fenêtre de validité des alertes (starts_at / ends_at, heure Tahiti).
 */

import type { AlertRow } from "@/lib/supabase/types";
import { getAdminSupabase } from "@/lib/supabase/admin";

/** Interprète un champ datetime-local admin comme heure de Tahiti (UTC−10). */
export function parseDatetimeLocalTahiti(value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) {
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : new Date(ms).toISOString();
  }

  const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? "00"}-10:00`;
  return new Date(iso).toISOString();
}

export function isAlertVisibleNow(
  alert: Pick<AlertRow, "active" | "starts_at" | "ends_at">,
  atMs: number = Date.now(),
): boolean {
  if (!alert.active) return false;
  if (alert.starts_at && Date.parse(alert.starts_at) > atMs) return false;
  if (alert.ends_at && Date.parse(alert.ends_at) <= atMs) return false;
  return true;
}

export function isAlertExpired(
  alert: Pick<AlertRow, "ends_at">,
  atMs: number = Date.now(),
): boolean {
  return Boolean(alert.ends_at && Date.parse(alert.ends_at) <= atMs);
}

/** Désactive les alertes dont la date de fin est dépassée. */
export async function expirePastAlerts(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("alerts")
    .select("id")
    .eq("active", true)
    .not("ends_at", "is", null)
    .lte("ends_at", now);

  if (error || !data?.length) return 0;

  const ids = data.map((r) => r.id);
  const { error: updErr } = await admin
    .from("alerts")
    .update({ active: false, updated_at: now })
    .in("id", ids);

  if (updErr) return 0;
  return ids.length;
}
