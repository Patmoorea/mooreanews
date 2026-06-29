/**
 * Médecins de garde — affiche officielle publiée par le COPPF
 * https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { inferWeekendFromPostDate } from "@/lib/garde-announcement-parse";
import {
  isGardeWeekRelevant,
  pickBestGardeSnapshot,
} from "@/lib/garde-moorea-data";

export const COPPF_MEDECINS_GARDE_URL =
  "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/";

export const COPPF_PHARMACIES_GARDE_URL =
  "https://www.ordre-pharmaciens-polynesie.com/pharmacies-de-garde/";

/** Samedi–dimanche de la semaine ISO N (affiche type 2026_GARDES_SEM26.jpg). */
export function weekendFromIsoWeek(
  year: number,
  isoWeek: number,
): { validFrom: string; validTo: string; label: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1);
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (isoWeek - 1) * 7);
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const validFrom = saturday.toISOString().slice(0, 10);
  const validTo = sunday.toISOString().slice(0, 10);
  return {
    validFrom,
    validTo,
    label: `Semaine ${isoWeek} — samedi ${validFrom.slice(8, 10)} / dimanche ${validTo.slice(8, 10)}`,
  };
}

function datesFromImageUrl(url: string): ReturnType<typeof inferWeekendFromPostDate> {
  const fname = (url.split("/").pop() ?? "").replace(/\.[a-z]+$/i, "");
  const yearFromPath = url.match(/uploads\/(\d{4})\//)?.[1];
  const year = yearFromPath ? Number(yearFromPath) : new Date().getFullYear();

  const sem = fname.match(/SEM(\d{1,2})/i);
  if (sem) {
    return weekendFromIsoWeek(year, Number(sem[1]));
  }

  const m =
    url.match(/(\d{4})[._-]?(\d{2})[._-]?(\d{2})/) ??
    url.match(/(\d{4})\/(\d{2})\/[^/]+/);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}T12:00:00.000Z`;
  return inferWeekendFromPostDate(iso);
}

/** Récupère l'URL de l'affiche médecins (dernier upload sur la page). */
export async function fetchCoppfGardeImageUrl(): Promise<{
  imageUrl: string;
  postedAt?: string;
} | null> {
  try {
    const res = await fetch(COPPF_MEDECINS_GARDE_URL, {
      headers: {
        Accept: "text/html",
        "User-Agent": "MooreaNews/1.0 (+https://www.mooreanews.com; garde COPPF)",
      },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const html = await res.text();
    const candidates: { url: string; score: number; postedAt?: string }[] = [];

    const re =
      /src="(https:\/\/www\.ordre-pharmaciens-polynesie\.com\/wp-content\/uploads\/(\d{4})\/(\d{2})\/([^"]+\.(?:jpg|jpeg|png|webp)))"/gi;

    let match: RegExpExecArray | null;
    while ((match = re.exec(html)) !== null) {
      const url = match[1]!;
      const fname = match[4]!.toLowerCase();
      if (/logo|favicon|plan|situation|cropped|carte/.test(fname)) continue;
      if (fname.includes("logo-texte")) continue;

      const score =
        Number(match[2]) * 1000 +
        Number(match[3]) * 10 +
        (/(screenshot|garde|medecin|drive|sem\d)/i.test(fname) ? 200 : 0);

      const dateM = fname.match(/(\d{4})(\d{2})(\d{2})/);
      const postedAt = dateM
        ? `${dateM[1]}-${dateM[2]}-${dateM[3]}T12:00:00.000Z`
        : `${match[2]}-${match[3]}-01T12:00:00.000Z`;

      candidates.push({ url, score, postedAt });
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];
    if (!best) return null;

    return { imageUrl: best.url, postedAt: best.postedAt };
  } catch {
    return null;
  }
}

/** Snapshot COPPF (affiche hebdo ordre des médecins) — source prioritaire. */
export async function fetchCoppfGardeSnapshot(
  now = new Date(),
): Promise<GardeMooreaSnapshot | null> {
  const image = await fetchCoppfGardeImageUrl();
  if (!image) return null;

  const dates =
    datesFromImageUrl(image.imageUrl) ??
    (image.postedAt ? inferWeekendFromPostDate(image.postedAt) : null);

  if (!dates) return null;
  if (!isGardeWeekRelevant(now, dates.validFrom, dates.validTo)) return null;

  return {
    ...dates,
    doctor: null,
    pharmacy: null,
    communePosterUrl: image.imageUrl,
    posterImageUrl: null,
    sourceUrl: COPPF_MEDECINS_GARDE_URL,
    syncedAt: new Date().toISOString(),
  };
}

/** @deprecated Utiliser fetchCoppfGardeSnapshot */
export async function fetchGardeFromOrdrePharmaciens(
  now = new Date(),
): Promise<GardeMooreaSnapshot | null> {
  return fetchCoppfGardeSnapshot(now);
}

export function mergeGardeSnapshots(
  primary: GardeMooreaSnapshot,
  supplement: GardeMooreaSnapshot,
): GardeMooreaSnapshot {
  return {
    ...primary,
    doctor: primary.doctor?.name ? primary.doctor : supplement.doctor ?? primary.doctor,
    pharmacy: primary.pharmacy?.name ? primary.pharmacy : supplement.pharmacy ?? primary.pharmacy,
    pharmacyHours:
      primary.pharmacyHours?.length ? primary.pharmacyHours : supplement.pharmacyHours,
    doctorHours: primary.doctorHours ?? supplement.doctorHours,
    doctorAddress: primary.doctorAddress ?? supplement.doctorAddress,
    communePosterUrl: primary.communePosterUrl ?? supplement.communePosterUrl,
    posterImageUrl: primary.posterImageUrl ?? supplement.posterImageUrl,
    articleSlug: primary.articleSlug ?? supplement.articleSlug,
    sourceUrl: primary.sourceUrl ?? supplement.sourceUrl,
    syncedAt: new Date().toISOString(),
  };
}

export async function pickGardeWithCoppf(
  candidates: GardeMooreaSnapshot[],
  now = new Date(),
): Promise<GardeMooreaSnapshot | null> {
  const coppf = await fetchCoppfGardeSnapshot(now).catch(() => null);
  const all = coppf ? [coppf, ...candidates] : candidates;
  const best = pickBestGardeSnapshot(all.filter(Boolean), now);
  if (!best) return coppf;

  if (coppf && coppf.validFrom === best.validFrom) {
    return mergeGardeSnapshots(coppf, best);
  }
  return best;
}
