/**
 * Statut d’ouverture vérifié — Google Places ou déclaration commerçant (< 12 h).
 * Jamais de devinette à partir du texte « Mar-Dim 11h-22h ».
 */

import {
  getPlaceOpenNowCached,
  googlePlacesConfigured,
} from "@/lib/google-places";

export type OpenStatusSource = "merchant" | "google";

export type RestaurantOpenMeta = {
  slug: string;
  name: string;
  district: string;
  googlePlaceId?: string | null;
  merchantOpenStatus?: "open" | "closed" | null;
  merchantOpenUpdatedAt?: string | null;
};

export type ResolvedOpenStatus = {
  isOpen: boolean;
  source: OpenStatusSource;
};

export type OpenStatusResult =
  | { state: "open"; source: OpenStatusSource }
  | { state: "closed"; source: OpenStatusSource }
  | { state: "unknown" };

/** Durée de validité d’une déclaration commerçant (heures). */
const MERCHANT_TTL_HOURS = 12;

export const OPEN_STATUS_HELP =
  "Ouvert / fermé confirmé via Google Maps ou déclaration commerçant du jour — jamais estimé à partir du texte horaires.";

function merchantStillFresh(updatedAt: string | null | undefined): boolean {
  if (!updatedAt) return false;
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= MERCHANT_TTL_HOURS * 60 * 60 * 1000;
}

export async function resolveRestaurantOpenStatus(
  r: RestaurantOpenMeta,
): Promise<OpenStatusResult> {
  if (
    merchantStillFresh(r.merchantOpenUpdatedAt) &&
    (r.merchantOpenStatus === "open" || r.merchantOpenStatus === "closed")
  ) {
    return {
      state: r.merchantOpenStatus === "open" ? "open" : "closed",
      source: "merchant",
    };
  }

  if (r.googlePlaceId && googlePlacesConfigured()) {
    const open = await getPlaceOpenNowCached(r.googlePlaceId);
    if (open === true) return { state: "open", source: "google" };
    if (open === false) return { state: "closed", source: "google" };
  }

  return { state: "unknown" };
}

export type OpenRestaurantNow = {
  slug: string;
  name: string;
  district: string;
  source: OpenStatusSource;
};

/** Liste des restos ouverts maintenant — uniquement statuts vérifiés. */
export async function listOpenRestaurantsNow(
  restaurants: RestaurantOpenMeta[],
): Promise<OpenRestaurantNow[]> {
  const results = await Promise.all(
    restaurants.map(async (r) => ({
      r,
      status: await resolveRestaurantOpenStatus(r),
    })),
  );

  return results
    .filter(
      (entry): entry is { r: RestaurantOpenMeta; status: { state: "open"; source: OpenStatusSource } } =>
        entry.status.state === "open",
    )
    .map(({ r, status }) => ({
      slug: r.slug,
      name: r.name,
      district: r.district,
      source: status.source,
    }));
}

export function openStatusLabel(source: OpenStatusSource): string {
  return source === "google" ? "Google Maps" : "Commerçant";
}

export function isOpenStatusConfigured(): boolean {
  return googlePlacesConfigured();
}
