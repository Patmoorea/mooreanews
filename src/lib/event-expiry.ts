/**
 * Événements passés — dépublication automatique (aligné sur site-content-audit).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

/** Même délai que l'audit : 14 jours après la date de fin. */
export const PAST_EVENT_GRACE_DAYS = 14;

export function pastEventCutoffIso(now = new Date()): string {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - PAST_EVENT_GRACE_DAYS);
  return cutoff.toISOString().slice(0, 10);
}

/** Dépublie les événements terminés depuis plus de 14 jours. */
export async function expirePastEvents(now = new Date()): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const cutoff = pastEventCutoffIso(now);

  const { data: rows } = await admin
    .from("events")
    .select("id, date, end_date")
    .eq("published", true)
    .limit(500);

  const ids = (rows ?? [])
    .filter((row) => {
      const end = row.end_date ?? row.date;
      return end && end < cutoff;
    })
    .map((row) => row.id);

  if (ids.length === 0) return 0;

  const { error } = await admin
    .from("events")
    .update({ published: false })
    .in("id", ids);

  if (error) return 0;

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/evenements");
  revalidatePath("/", "layout");

  return ids.length;
}
