/**
 * Génère et stocke l'affiche garde MooreaNews (PNG).
 */

import { SITE } from "@/lib/constants";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { renderGardeWeekendPosterPng, posterHasDisplayContent } from "@/lib/garde-weekend-poster";
import { uploadBufferToMedia } from "@/lib/media-upload";
import { getAdminSupabase } from "@/lib/supabase/admin";

export function gardePosterHasContent(snap: GardeMooreaSnapshot): boolean {
  return posterHasDisplayContent(snap);
}

export async function renderAndUploadMooreaNewsGardePoster(
  snap: GardeMooreaSnapshot,
): Promise<string | null> {
  if (!gardePosterHasContent(snap)) return null;

  const admin = getAdminSupabase();
  const path = `generated/garde-weekend/garde-moorea-${snap.validFrom}.png`;

  try {
    const png = await renderGardeWeekendPosterPng(snap);
    if (admin) {
      const uploaded = await uploadBufferToMedia(admin, png, path, "image/png");
      if (uploaded.ok) return uploaded.url;
    }
  } catch {
    /* fallback URL dynamique */
  }

  const base = SITE.url.replace(/\/$/, "");
  return `${base}/api/garde-weekend/poster/${snap.validFrom}`;
}
