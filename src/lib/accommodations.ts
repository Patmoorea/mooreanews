/**
 * Hébergements touristiques — annuaire curaté + annonces location.
 */

import accommodationsData from "@/../data/accommodations.json";
import { getAnnouncements } from "@/lib/content";
import type { Announcement } from "@/lib/content-types";
import { dbListAccommodations } from "@/lib/supabase/queries";
import type { AccommodationRow } from "@/lib/supabase/types";
import { resolveAccommodationAvailability } from "@/lib/accommodation-availability";

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
  website?: string | null;
  priceHint?: string | null;
  lat?: number | null;
  lon?: number | null;
  availabilityStatus: AvailabilityStatus;
  featured?: boolean;
  premium?: boolean;
  source: "directory" | "announcement";
  href?: string;
  price?: string;
  coverUrl?: string | null;
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

function isPremium(row: AccommodationRow): boolean {
  if (!row.premium_until) return false;
  return new Date(row.premium_until).getTime() > Date.now();
}

function fromRow(row: AccommodationRow): Accommodation {
  const premium = isPremium(row);
  const { status } = resolveAccommodationAvailability({
    slug: row.slug,
    availabilityStatus: row.availability_status,
    merchantAvailabilityStatus: row.merchant_availability_status,
    merchantAvailabilityUpdatedAt: row.merchant_availability_updated_at,
  });
  return {
    slug: row.slug,
    name: row.name,
    type: row.type,
    district: row.district,
    description: row.description,
    contact: row.phone ?? row.email ?? "Contacter l'établissement",
    website: row.url,
    priceHint: row.price_hint,
    lat: row.lat,
    lon: row.lon,
    availabilityStatus: status,
    featured: row.featured || premium,
    premium,
    source: "directory",
    href: `/hebergements/${row.slug}`,
    coverUrl: row.cover_url,
  };
}

type JsonEntry = (typeof accommodationsData)[number];

function fromJson(entry: JsonEntry): Accommodation {
  return {
    slug: entry.slug,
    name: entry.name,
    type: entry.type as AccommodationType,
    district: entry.district,
    description: entry.description,
    contact: entry.phone ?? "Contacter l'établissement",
    website: entry.website ?? null,
    priceHint: entry.priceHint ?? null,
    lat: entry.lat,
    lon: entry.lon,
    availabilityStatus: (entry.availabilityStatus ??
      "contact") as AvailabilityStatus,
    featured: entry.featured,
    source: "directory",
    href: `/hebergements/${entry.slug}`,
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

function sortAccommodations(items: Accommodation[]): Accommodation[] {
  return items.slice().sort((a, b) => {
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
}

export async function getAccommodations(): Promise<Accommodation[]> {
  const db = await dbListAccommodations();
  if (db?.length) return sortAccommodations(db.map(fromRow));
  return sortAccommodations(
    (accommodationsData as JsonEntry[]).map(fromJson),
  );
}

/** Annuaire + annonces « location » publiées sur MooreaNews. */
export async function getVisitorAccommodations(): Promise<Accommodation[]> {
  const [directory, announcements] = await Promise.all([
    getAccommodations(),
    getAnnouncements(),
  ]);

  const locations = announcements
    .filter((a) => a.type === "location")
    .map(fromAnnouncement);

  return sortAccommodations([...directory, ...locations]);
}

export async function getAccommodationBySlug(
  slug: string,
): Promise<Accommodation | undefined> {
  const all = await getAccommodations();
  return all.find((a) => a.slug === slug && a.source === "directory");
}

export async function getAccommodationRowBySlug(
  slug: string,
): Promise<AccommodationRow | null> {
  const db = await dbListAccommodations();
  if (!db) return null;
  return db.find((r) => r.slug === slug) ?? null;
}
