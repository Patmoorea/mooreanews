/**
 * Importe dans Supabase les restaurants du catalogue JSON (/data/restaurants.json)
 * qui n'existent pas encore en base (comparaison par nom).
 * N'écrase ni ne supprime rien — sûr après une suppression admin.
 */

import restaurantsData from "@/../data/restaurants.json";
import type { Restaurant } from "@/lib/content-types";
import { catalogOpeningHoursForName } from "@/lib/restaurant-catalog";
import { getAdminSupabase } from "@/lib/supabase/admin";

function restaurantToRow(r: Restaurant) {
  return {
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    district: r.district,
    address: r.address,
    phone: r.phone ?? null,
    hours: r.openingHours ?? null,
    price_range: r.priceLevel ? String(r.priceLevel) : null,
    lat: r.lat ?? null,
    lon: r.lon ?? null,
    cover_url: r.image ?? null,
    url: r.website ?? null,
    published: true,
    featured: Boolean(r.premium),
  };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Nouveautés du catalogue proposées à l’import 1 clic.
 * Le reste du JSON sert de référence / fallback local — une suppression admin
 * ne doit pas réafficher Mahogany, Beach Café, etc.
 */
export const RESTAURANT_CATALOG_IMPORT_SLUGS = new Set([
  "snack-moorea-maitai",
  "moz-pizza-moorea",
]);

function isImportCandidate(r: Restaurant): boolean {
  return RESTAURANT_CATALOG_IMPORT_SLUGS.has(r.slug);
}

/** Compare le catalogue JSON aux noms déjà en base (côté admin). */
export function getMissingRestaurantsFromCatalog(
  existingNames: string[],
  options?: { importCandidatesOnly?: boolean }
): Restaurant[] {
  const existing = new Set(existingNames.map(normalizeName));
  return (restaurantsData as Restaurant[]).filter((r) => {
    if (options?.importCandidatesOnly && !isImportCandidate(r)) return false;
    return !existing.has(normalizeName(r.name));
  });
}

export async function listMissingRestaurantsFromJson(): Promise<Restaurant[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];

  const { data: existing } = await supabase.from("restaurants").select("name");
  return getMissingRestaurantsFromCatalog(
    (existing ?? []).map((r) => r.name),
    { importCandidatesOnly: true }
  );
}

export async function importMissingRestaurantsFromJson(): Promise<{
  imported: string[];
  skipped: number;
  error?: string;
}> {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { imported: [], skipped: 0, error: "Supabase non configuré" };
  }

  const missing = await listMissingRestaurantsFromJson();
  const imported: string[] = [];

  for (const r of missing) {
    const { error } = await supabase.from("restaurants").insert(restaurantToRow(r));
    if (error) {
      return { imported, skipped: 0, error: `${r.name}: ${error.message}` };
    }
    imported.push(r.name);
  }

  const jsonCount = (restaurantsData as Restaurant[]).length;
  return {
    imported,
    skipped: jsonCount - missing.length,
  };
}

/** Recopie les horaires du catalogue JSON vers Supabase (match par nom). */
export async function backfillRestaurantHoursFromCatalog(): Promise<{
  updated: number;
  names: string[];
  error?: string;
}> {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { updated: 0, names: [], error: "Supabase non configuré" };
  }

  const { data: rows, error: listError } = await supabase
    .from("restaurants")
    .select("id, name, hours");

  if (listError) {
    return { updated: 0, names: [], error: listError.message };
  }

  const names: string[] = [];
  let updated = 0;

  for (const row of rows ?? []) {
    const catalogHours = catalogOpeningHoursForName(row.name);
    if (!catalogHours) continue;
    const current = (row.hours ?? "").trim();
    if (current === catalogHours) continue;

    const { error } = await supabase
      .from("restaurants")
      .update({ hours: catalogHours })
      .eq("id", row.id);

    if (!error) {
      updated += 1;
      names.push(row.name);
    }
  }

  return { updated, names };
}
