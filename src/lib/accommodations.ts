/**
 * Hébergements touristiques — annuaire curaté + annonces location.
 */

import accommodationsData from "@/../data/accommodations.json";
import { getAnnouncements } from "@/lib/content";
import type { Announcement } from "@/lib/content-types";

export type AccommodationType = "hotel" | "pension" | "fare" | "villa";

export type AvailabilityStatus =
  | "available"
  | "limited"
  | "contact"
  | "full";

export type Accommodation = {
  slug: string;
  name: string;
  type: AccommodationType;
  district: string;
  description: string;
  contact: string;
  website?: string;
  lat?: number;
  lon?: number;
  availabilityStatus: AvailabilityStatus;
  featured?: boolean;
  source: "directory" | "announcement";
  href?: string;
  price?: string;
};

const TYPE_LABELS: Record<AccommodationType, string> = {
  hotel: "Hôtel / resort",
  pension: "Pension",
  fare: "Fare",
  villa: "Villa / location",
};

const AVAIL_LABELS: Record<AvailabilityStatus, string> = {
  available: "Disponible",
  limited: "Places limitées",
  contact: "Contacter pour dispo",
  full: "Complet",
};

export function accommodationTypeLabel(type: AccommodationType): string {
  return TYPE_LABELS[type];
}

export function availabilityLabel(status: AvailabilityStatus): string {
  return AVAIL_LABELS[status];
}

function fromJson(
  row: (typeof accommodationsData)[number],
): Accommodation {
  return {
    ...row,
    type: row.type as AccommodationType,
    availabilityStatus: row.availabilityStatus as AvailabilityStatus,
    source: "directory",
    href: row.website,
  };
}

function fromAnnouncement(a: Announcement): Accommodation {
  return {
    slug: a.slug,
    name: a.title,
    type: "villa",
    district: a.district ?? "Moorea",
    description: a.body.slice(0, 160),
    contact: a.contact,
    availabilityStatus: "available",
    featured: a.boosted,
    source: "announcement",
    href: `/annonces/${a.slug}`,
    price: a.price,
  };
}

/** Annuaire + annonces « location » publiées sur MooreaNews. */
export async function getVisitorAccommodations(): Promise<Accommodation[]> {
  const directory = (accommodationsData as typeof accommodationsData).map(
    fromJson,
  );
  const announcements = (await getAnnouncements())
    .filter((a) => a.type === "location")
    .map(fromAnnouncement);

  const merged = [...directory, ...announcements].sort((a, b) => {
    const af = a.featured ? 1 : 0;
    const bf = b.featured ? 1 : 0;
    if (af !== bf) return bf - af;
    const order: Record<AvailabilityStatus, number> = {
      available: 0,
      limited: 1,
      contact: 2,
      full: 3,
    };
    return order[a.availabilityStatus] - order[b.availabilityStatus];
  });

  return merged;
}
