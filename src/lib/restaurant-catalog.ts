/**
 * Catalogue local /data/restaurants.json — horaires et fiches de référence.
 */

import restaurantsData from "@/../data/restaurants.json";
import type { Restaurant } from "@/lib/content-types";

const catalog = restaurantsData as Restaurant[];

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

const byName = new Map(catalog.map((r) => [normalizeName(r.name), r]));
const bySlug = new Map(catalog.map((r) => [r.slug, r]));

export function restaurantFromCatalogByName(name: string): Restaurant | undefined {
  return byName.get(normalizeName(name));
}

export function restaurantFromCatalogBySlug(slug: string): Restaurant | undefined {
  return bySlug.get(slug);
}

export function allRestaurantCatalogEntries(): Restaurant[] {
  return catalog.slice();
}

export function catalogOpeningHoursForName(name: string): string | null {
  const h = restaurantFromCatalogByName(name)?.openingHours?.trim();
  return h || null;
}

export function catalogOpeningHoursForRestaurant(
  name: string,
  slug?: string | null,
): string | null {
  return (
    catalogOpeningHoursForName(name) ||
    (slug ? restaurantFromCatalogBySlug(slug)?.openingHours?.trim() || null : null)
  );
}
