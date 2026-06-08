/**
 * Génère et stocke l'affiche récap semaine MooreaNews (PNG).
 */

import { SITE } from "@/lib/constants";
import type { WeeklyRecapSnapshot } from "@/lib/weekly-recap-data";
import { renderWeeklyRecapPosterPng } from "@/lib/weekly-recap-poster";
import { uploadBufferToMedia } from "@/lib/media-upload";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function renderAndUploadWeeklyRecapPoster(
  snap: WeeklyRecapSnapshot,
): Promise<string | null> {
  const admin = getAdminSupabase();
  const path = `generated/weekly-recap/agenda-semaine-${snap.weekStart}.png`;

  try {
    const png = await renderWeeklyRecapPosterPng(snap);
    if (admin) {
      const uploaded = await uploadBufferToMedia(admin, png, path, "image/png");
      if (uploaded.ok) return uploaded.url;
    }
  } catch {
    /* fallback dynamique */
  }

  const base = SITE.url.replace(/\/$/, "");
  return `${base}/api/weekly-recap/poster/${snap.weekStart}`;
}
