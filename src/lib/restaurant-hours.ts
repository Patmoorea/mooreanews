/**
 * Horaires d'ouverture affichés — catalogue JSON, base Supabase, Google Maps (texte).
 * Pas de devinette à partir d'un parsing « ouvert maintenant ».
 */

import { catalogOpeningHoursForRestaurant } from "@/lib/restaurant-catalog";
import {
  getPlaceOpeningHoursCached,
  googlePlacesConfigured,
} from "@/lib/google-places";
import type { Restaurant } from "@/lib/content-types";

export async function resolveRestaurantOpeningHours(
  r: Pick<Restaurant, "name" | "openingHours" | "googlePlaceId"> & {
    slug?: string;
  },
): Promise<string | undefined> {
  const fromCatalog = catalogOpeningHoursForRestaurant(r.name, r.slug);
  if (fromCatalog) return fromCatalog;

  const fromDb = r.openingHours?.trim();
  if (fromDb) return fromDb;

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
      const openingHours = await resolveRestaurantOpeningHours({
        name: r.name,
        openingHours: r.openingHours,
        googlePlaceId: r.googlePlaceId,
        slug: r.slug,
      });
      return openingHours && openingHours !== r.openingHours
        ? { ...r, openingHours }
        : r;
    }),
  );
}
