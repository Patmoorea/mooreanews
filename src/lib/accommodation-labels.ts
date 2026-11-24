/**
 * Types et libellés hébergement, sans accès base ni JSON.
 * Importable depuis un composant client.
 */

export type AccommodationType = "hotel" | "pension" | "fare" | "villa";

export type AvailabilityStatus = "available" | "limited" | "contact" | "full";

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
