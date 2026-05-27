/**
 * Importe dans Supabase les restaurants du catalogue JSON (/data/restaurants.json)
 * qui n'existent pas encore en base (comparaison par nom).
 * N'écrase ni ne supprime rien — sûr après une suppression admin.
 */

import restaurantsData from "@/../data/restaurants.json";
import type { Restaurant } from "@/lib/content-types";
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
    price_range: r.priceLevel ? "€".repeat(r.priceLevel) : null,
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

export async function listMissingRestaurantsFromJson(): Promise<Restaurant[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];

  const { data: existing } = await supabase.from("restaurants").select("name");
  const existingNames = new Set(
    (existing ?? []).map((r) => normalizeName(r.name))
  );

  return (restaurantsData as Restaurant[]).filter(
    (r) => !existingNames.has(normalizeName(r.name))
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
