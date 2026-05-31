/**
 * Horaires d'ouverture affichés — catalogue JSON, base Supabase, Google Maps (texte).
 * Pas de devinette à partir d'un parsing « ouvert maintenant ».
 */

import { catalogOpeningHoursForName } from "@/lib/restaurant-catalog";
import {
  getPlaceOpeningHoursCached,
  googlePlacesConfigured,
} from "@/lib/google-places";
import type { Restaurant } from "@/lib/content-types";

export async function resolveRestaurantOpeningHours(
  r: Pick<Restaurant, "name" | "openingHours" | "googlePlaceId">,
): Promise<string | undefined> {
  const fromDb = r.openingHours?.trim();
  if (fromDb) return fromDb;

  const fromCatalog = catalogOpeningHoursForName(r.name);
  if (fromCatalog) return fromCatalog;

  if (r.googlePlaceId && googlePlacesConfigured()) {
    const fromGoogle = await getPlaceOpeningHoursCached(r.googlePlaceId);
    if (fromGoogle) return fromGoogle;
  }

  return undefined;
}

export async function enrichRestaurantsWithHours(
  restaurants: Restaurant[],
): Promise<Restaurant[]> {
  return Promise.all(
    restaurants.map(async (r) => {
      const openingHours = await resolveRestaurantOpeningHours(r);
      return openingHours && openingHours !== r.openingHours
        ? { ...r, openingHours }
        : r;
    }),
  );
}
