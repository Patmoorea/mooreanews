/**
 * Disponibilité hébergement — déclaration hébergeur (< 48 h) ou statut admin.
 */

import type { AvailabilityStatus } from "@/lib/accommodations";

const MERCHANT_TTL_HOURS = 48;

export type AccommodationAvailabilityMeta = {
  slug: string;
  availabilityStatus: AvailabilityStatus;
  merchantAvailabilityStatus?: AvailabilityStatus | null;
  merchantAvailabilityUpdatedAt?: string | null;
};

function merchantStillFresh(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return false;
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= MERCHANT_TTL_HOURS * 60 * 60 * 1000;
}

export function resolveAccommodationAvailability(
  row: AccommodationAvailabilityMeta,
): { status: AvailabilityStatus; source: "merchant" | "directory" } {
  if (
    merchantStillFresh(row.merchantAvailabilityUpdatedAt) &&
    row.merchantAvailabilityStatus
  ) {
    return { status: row.merchantAvailabilityStatus, source: "merchant" };
  }
  return { status: row.availabilityStatus, source: "directory" };
}

export const ACCOMMODATION_AVAILABILITY_HELP =
  "Disponibilité confirmée par l'hébergeur (< 48 h) ou fiche annuaire MooreaNews.";
