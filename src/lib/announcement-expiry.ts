/**
 * Annonces périmées — masquage public et dépublication automatique.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

/** Au-delà de 90 jours, une annonce n’est plus affichée (sauf expires_at plus court). */
export const ANNOUNCEMENT_MAX_AGE_DAYS = 90;

export function isAnnouncementVisible(row: {
  expires_at?: string | null;
  created_at: string;
}): boolean {
  const now = Date.now();
  if (row.expires_at && Date.parse(row.expires_at) < now) return false;
  const ageMs = now - Date.parse(row.created_at);
  if (Number.isNaN(ageMs)) return false;
  return ageMs <= ANNOUNCEMENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
}

/** Dépublie les annonces expirées ou trop anciennes. */
export async function expireStaleAnnouncements(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const cutoff = new Date(
    Date.now() - ANNOUNCEMENT_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const now = new Date().toISOString();

  const { data: byAge } = await admin
    .from("announcements")
    .select("id")
    .eq("published", true)
    .lt("created_at", cutoff);

  const { data: byExpiry } = await admin
    .from("announcements")
    .select("id")
    .eq("published", true)
    .not("expires_at", "is", null)
    .lte("expires_at", now);

  const ids = [
    ...new Set([
      ...(byAge ?? []).map((r) => r.id),
      ...(byExpiry ?? []).map((r) => r.id),
    ]),
  ];

  if (ids.length === 0) return 0;

  const { error } = await admin
    .from("announcements")
    .update({ published: false })
    .in("id", ids);

  if (error) return 0;

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/annonces");
  revalidatePath("/covoiturage");

  return ids.length;
}
