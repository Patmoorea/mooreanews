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
export async function expirePastEvents(now = new Date()): Promise<{
  unpublished: number;
  titles: string[];
}> {
  const admin = getAdminSupabase();
  if (!admin) return { unpublished: 0, titles: [] };

  const cutoff = pastEventCutoffIso(now);

  const { data: rows } = await admin
    .from("events")
    .select("id, title, date, end_date")
    .eq("published", true)
    .limit(500);

  const stale = (rows ?? []).filter((row) => {
    const end = row.end_date ?? row.date;
    return end && end < cutoff;
  });

  if (stale.length === 0) return { unpublished: 0, titles: [] };

  const ids = stale.map((row) => row.id);
  const { error } = await admin
    .from("events")
    .update({ published: false })
    .in("id", ids);

  if (error) return { unpublished: 0, titles: [] };

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/evenements");
  revalidatePath("/", "layout");

  return {
    unpublished: ids.length,
    titles: stale.map((r) => r.title).filter(Boolean),
  };
}
