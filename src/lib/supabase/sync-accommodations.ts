/**
 * Import catalogue JSON → table accommodations (admin, 1 clic).
 */

import accommodationsData from "@/../data/accommodations.json";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AccommodationRow } from "@/lib/supabase/types";

type CatalogEntry = (typeof accommodationsData)[number];

function catalogToRow(entry: CatalogEntry): Partial<AccommodationRow> {
  return {
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    type: entry.type as AccommodationRow["type"],
    district: entry.district,
    phone: entry.phone ?? null,
    url: entry.website ?? null,
    price_hint: entry.priceHint ?? null,
    availability_status: (entry.availabilityStatus ??
      "contact") as AccommodationRow["availability_status"],
    lat: entry.lat ?? null,
    lon: entry.lon ?? null,
    published: true,
    featured: Boolean(entry.featured),
    display_order: entry.displayOrder ?? 0,
  };
}

export function getMissingAccommodationsFromCatalog(
  existingSlugs: string[],
): CatalogEntry[] {
  const existing = new Set(existingSlugs.map((s) => s.trim().toLowerCase()));
  return (accommodationsData as CatalogEntry[]).filter(
    (e) => !existing.has(e.slug.toLowerCase()),
  );
}

export async function importMissingAccommodationsFromJson(): Promise<{
  imported: string[];
  skipped: number;
  error?: string;
}> {
  const admin = getAdminSupabase();
  if (!admin) {
    return { imported: [], skipped: 0, error: "Supabase non configuré" };
  }

  const { data: existing } = await admin.from("accommodations").select("slug");
  const missing = getMissingAccommodationsFromCatalog(
    (existing ?? []).map((r) => r.slug),
  );

  if (missing.length === 0) {
    return { imported: [], skipped: 0 };
  }

  const imported: string[] = [];
  for (const entry of missing) {
    const { error } = await admin.from("accommodations").insert(catalogToRow(entry));
    if (error) {
      return {
        imported,
        skipped: missing.length - imported.length,
        error: error.message,
      };
    }
    imported.push(entry.name);
  }

  return { imported, skipped: missing.length - imported.length };
}

export async function listMissingAccommodationsFromJson(): Promise<
  CatalogEntry[]
> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  const { data: existing } = await admin.from("accommodations").select("slug");
  return getMissingAccommodationsFromCatalog(
    (existing ?? []).map((r) => r.slug),
  );
}
