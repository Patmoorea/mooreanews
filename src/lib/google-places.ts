/**
 * Google Places API (New) — statut ouvert en temps réel.
 * Nécessite GOOGLE_PLACES_API_KEY (Places API activée sur le projet GCP).
 */

import { unstable_cache } from "next/cache";

const PLACES_BASE = "https://places.googleapis.com/v1";

export function googlePlacesConfigured(): boolean {
  return Boolean(process.env.GOOGLE_PLACES_API_KEY?.trim());
}

/** Place ID brut (ChIJ…) ou resource name places/ChIJ… */
export function normalizePlaceId(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("places/")) return t.slice("places/".length);
  return t;
}

async function fetchPlaceOpeningHoursText(placeId: string): Promise<string | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;

  const id = normalizePlaceId(placeId);
  if (!id) return null;

  try {
    const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(id)}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "regularOpeningHours.weekdayDescriptions",
      },
      next: { revalidate: 604800 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      regularOpeningHours?: { weekdayDescriptions?: string[] };
    };
    const lines = data.regularOpeningHours?.weekdayDescriptions;
    if (!lines?.length) return null;
    return lines.join(" · ");
  } catch {
    return null;
  }
}

/** Horaires affichage (texte Google Maps) — cache 7 jours. */
export function getPlaceOpeningHoursCached(placeId: string): Promise<string | null> {
  const id = normalizePlaceId(placeId);
  return unstable_cache(
    () => fetchPlaceOpeningHoursText(id),
    [`google-place-hours-${id}`],
    { revalidate: 604800 },
  )();
}

async function fetchPlaceOpenNow(placeId: string): Promise<boolean | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return null;

  const id = normalizePlaceId(placeId);
  if (!id) return null;

  try {
    const res = await fetch(`${PLACES_BASE}/places/${encodeURIComponent(id)}`, {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "currentOpeningHours.openNow",
      },
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      console.warn("[google-places] place details", id, res.status);
      return null;
    }

    const data = (await res.json()) as {
      currentOpeningHours?: { openNow?: boolean };
    };

    if (typeof data.currentOpeningHours?.openNow === "boolean") {
      return data.currentOpeningHours.openNow;
    }
    return null;
  } catch (e) {
    console.warn("[google-places] fetch error", e);
    return null;
  }
}

/** Cache 15 min par établissement (évite quota API). */
export function getPlaceOpenNowCached(placeId: string): Promise<boolean | null> {
  const id = normalizePlaceId(placeId);
  return unstable_cache(
    () => fetchPlaceOpenNow(id),
    [`google-place-open-${id}`],
    { revalidate: 900 },
  )();
}

export type PlaceSearchHit = {
  placeId: string;
  name: string;
  address: string;
};

/** Recherche texte — admin uniquement (coût API). */
export async function searchPlacesOnMoorea(
  query: string,
): Promise<PlaceSearchHit[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key || !query.trim()) return [];

  try {
    const res = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: `${query.trim()} Moorea Polynésie`,
        locationBias: {
          circle: {
            center: { latitude: -17.5388, longitude: -149.8295 },
            radius: 12000,
          },
        },
        languageCode: "fr",
        regionCode: "PF",
        maxResultCount: 5,
      }),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as {
      places?: {
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
      }[];
    };

    return (data.places ?? [])
      .filter((p) => p.id)
      .map((p) => ({
        placeId: normalizePlaceId(p.id!),
        name: p.displayName?.text ?? "Sans nom",
        address: p.formattedAddress ?? "",
      }));
  } catch {
    return [];
  }
}
