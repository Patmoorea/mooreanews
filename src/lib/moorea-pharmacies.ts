/**
 * Pharmacies Moorea — la liste éditable est src/data/pharmacies-moorea.ts.
 */

import {
  MOOREA_PHARMACIES,
  type MooreaPharmacyRecord,
} from "@/data/pharmacies-moorea";
import type { InfoPratique } from "@/lib/content-types";

export type MooreaPharmacy = MooreaPharmacyRecord;

export { MOOREA_PHARMACIES };

function fold(value: string): string {
  return value.trim().toLowerCase();
}

function matchesPharmacy(item: InfoPratique, pharmacy: MooreaPharmacyRecord): boolean {
  if (item.slug === pharmacy.infoSlug) return true;
  const title = fold(item.title);
  return pharmacy.infoTitles.some((candidate) => fold(candidate) === title);
}

function toInfo(pharmacy: MooreaPharmacyRecord, previous?: InfoPratique): InfoPratique {
  return {
    slug: pharmacy.infoSlug,
    title: pharmacy.name,
    description: pharmacy.description,
    category: "sante",
    address: pharmacy.address,
    phone: pharmacy.phone,
    hours: pharmacy.hoursLabel,
    website: pharmacy.sources[0]?.href,
    image: previous?.image,
    lat: previous?.lat,
    lon: previous?.lon,
    mapIconUrl: previous?.mapIconUrl,
  };
}

/**
 * Les fiches publiques prennent l'adresse, le téléphone et les horaires du fichier
 * de données, même si la base a encore les anciens horaires.
 */
export function overlayPharmacyInfo(items: InfoPratique[]): InfoPratique[] {
  const consumed = new Set<string>();
  const next: InfoPratique[] = [];

  for (const item of items) {
    const pharmacy = MOOREA_PHARMACIES.find((candidate) => matchesPharmacy(item, candidate));
    if (!pharmacy) {
      next.push(item);
      continue;
    }
    if (consumed.has(pharmacy.id)) continue;
    consumed.add(pharmacy.id);
    next.push(toInfo(pharmacy, item));
  }

  for (const pharmacy of MOOREA_PHARMACIES) {
    if (!consumed.has(pharmacy.id)) next.push(toInfo(pharmacy));
  }

  return next;
}
