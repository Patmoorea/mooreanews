/**
 * Données publiques garde week-end (pastille accueil, ticker).
 */

import {
  readGardeMooreaFromCache,
  type GardeMooreaSnapshot,
} from "@/lib/garde-moorea-auto";
import { getArticleBySlug } from "@/lib/content";
import { gardeArticleSlug } from "@/lib/garde-weekend-article";
import { isGardeWeekActive, readGardeFileSnapshot } from "@/lib/garde-moorea-data";
import { tahitiParts } from "@/lib/tahiti-holidays";

export type GardeWeekendHighlight = {
  active: boolean;
  articleSlug: string;
  href: string;
  label: string;
  isFresh: boolean;
  weekendLabel: string;
  doctorName: string | null;
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
  return Boolean(
    snap.doctor?.name ||
      snap.pharmacy?.name ||
      snap.posterImageUrl ||
      (snap.pharmacyHours && snap.pharmacyHours.length > 0),
  );
}

async function resolveSnapshot(): Promise<GardeMooreaSnapshot | null> {
  const [cached, file] = await Promise.all([
    readGardeMooreaFromCache(),
    readGardeFileSnapshot(),
  ]);

  if (cached && snapshotHasContent(cached)) return cached;
  if (file && snapshotHasContent(file)) return file;
  return cached ?? file;
}

export async function getGardeWeekendHighlight(
  now = new Date(),
): Promise<GardeWeekendHighlight | null> {
  const snap = await resolveSnapshot();
  if (!snap || !snapshotHasContent(snap)) return null;

  if (!isGardeWeekActive(now, snap.validFrom, snap.validTo)) {
    return null;
  }

  const articleSlug = snap.articleSlug ?? gardeArticleSlug(snap.validFrom);
  const article = await getArticleBySlug(articleSlug);
  const href = article ? `/actualites/${articleSlug}` : "/sante-garde";

  return {
    active: true,
    articleSlug,
    href,
    label: buildStickerLabel(snap),
    isFresh: isFreshGarde(snap, now),
    weekendLabel: snap.label,
    doctorName: snap.doctor?.name ?? null,
  };
}
