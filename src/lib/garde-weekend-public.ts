/**
 * Données publiques garde week-end (pastille accueil, ticker).
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { gardeArticleSlug } from "@/lib/garde-weekend-article";
import {
  isGardeWeekRelevant,
  resolveGardeWeekendSnapshot,
  snapshotHasGardeContent,
} from "@/lib/garde-moorea-data";
import { resolveGardePosterPublicUrl } from "@/lib/garde-poster-url";
import { tahitiParts } from "@/lib/tahiti-holidays";

export type GardeWeekendHighlight = {
  active: boolean;
  articleSlug: string;
  href: string;
  label: string;
  isFresh: boolean;
  weekendLabel: string;
  doctorName: string | null;
  posterImageUrl: string | null;
};

function formatDoctorShort(name: string): string {
  const n = name.replace(/^Dr\.?\s+/i, "").trim();
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    return `Dr ${parts[parts.length - 1]}`;
  }
  return name.startsWith("Dr") ? name : `Dr ${n}`;
}

function buildStickerLabel(snap: GardeMooreaSnapshot): string {
  const { dow } = tahitiParts(new Date());
  const prefix =
    dow === 5 ? "Garde du week-end" : dow === 6 || dow === 0 ? "Garde WE" : "Garde Moorea";

  if (snap.doctor?.name) {
    return `${prefix} · ${formatDoctorShort(snap.doctor.name)} · affiche`;
  }
  return `${prefix} · voir l'affiche officielle`;
}

function isFreshGarde(snap: GardeMooreaSnapshot, now: Date): boolean {
  const synced = Date.parse(snap.syncedAt);
  if (!Number.isNaN(synced) && now.getTime() - synced <= 3 * 86400000) {
    return true;
  }
  const { dow } = tahitiParts(now);
  if (dow === 5) {
    const tomorrow = new Date(now.getTime() + 86400000).toLocaleDateString(
      "en-CA",
      { timeZone: "Pacific/Tahiti" },
    );
    return tomorrow === snap.validFrom;
  }
  return false;
}

function snapshotHasContent(snap: GardeMooreaSnapshot): boolean {
  return snapshotHasGardeContent(snap);
}

export async function getGardeWeekendHighlight(
  now = new Date(),
): Promise<GardeWeekendHighlight | null> {
  const snap = await resolveGardeWeekendSnapshot(now);
  if (!snap || !snapshotHasContent(snap)) return null;

  if (!isGardeWeekRelevant(now, snap.validFrom, snap.validTo)) {
    return null;
  }

  const articleSlug = snap.articleSlug ?? gardeArticleSlug(snap.validFrom);
  const href = `/actualites/${articleSlug}`;

  return {
    active: true,
    articleSlug,
    href,
    label: buildStickerLabel(snap),
    isFresh: isFreshGarde(snap, now),
    weekendLabel: snap.label,
    doctorName: snap.doctor?.name ?? null,
    posterImageUrl: resolveGardePosterPublicUrl(
      snap.posterImageUrl ?? snap.communePosterUrl,
    ),
  };
}
