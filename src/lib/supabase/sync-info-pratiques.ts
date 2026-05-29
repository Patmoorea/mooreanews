import infoData from "@/../data/info-pratiques.json";
import type { InfoPratique } from "@/lib/content-types";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  COORDS_MIGRATION_HINT,
  insertInfoPratiqueRow,
  type InfoPratiqueRowInput,
} from "@/lib/supabase/info-pratiques-db";

type InfoRowInput = InfoPratiqueRowInput;

function infoToRow(i: InfoPratique, displayOrder: number): InfoRowInput {
  return {
    title: i.title,
    description: i.description,
    category: i.category,
    display_order: displayOrder,
    address: i.address ?? null,
    phone: i.phone ?? null,
    hours: i.hours ?? null,
    url: i.website ?? null,
    lat: i.lat ?? null,
    lon: i.lon ?? null,
    published: true,
    emergency: false,
  };
}

import { normalizeInfoTitle } from "@/lib/info-catalog";

function normalizeTitle(title: string): string {
  return normalizeInfoTitle(title);
}

export function getMissingInfoPratiquesFromJson(
  existingTitles: string[],
): InfoPratique[] {
  const existing = new Set(existingTitles.map(normalizeTitle));
  return (infoData as InfoPratique[]).filter(
    (i) => !existing.has(normalizeTitle(i.title)),
  );
}

export async function listMissingInfoPratiquesFromJson(): Promise<InfoPratique[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];
  const { data: existing } = await supabase.from("info_pratiques").select("title");
  return getMissingInfoPratiquesFromJson((existing ?? []).map((r) => r.title));
}

export async function importMissingInfoPratiquesFromJson(): Promise<{
  imported: string[];
  skipped: number;
  error?: string;
  warning?: string;
}> {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { imported: [], skipped: 0, error: "Supabase non configuré" };
  }

  const missing = await listMissingInfoPratiquesFromJson();
  const imported: string[] = [];
  let legacySchema = false;

  // ordre stable : on garde l’ordre du fichier JSON
  const all = infoData as InfoPratique[];
  const orderByTitle = new Map(all.map((it, idx) => [it.title, idx]));

  for (const i of missing) {
    const displayOrder = orderByTitle.get(i.title) ?? 0;
    const { error, legacySchema: legacy } = await insertInfoPratiqueRow(
      supabase,
      infoToRow(i, displayOrder),
    );
    if (error) {
      return { imported, skipped: 0, error: `${i.title}: ${error}` };
    }
    if (legacy) legacySchema = true;
    imported.push(i.title);
  }

  const jsonCount = (infoData as InfoPratique[]).length;
  return {
    imported,
    skipped: jsonCount - missing.length,
    warning: legacySchema ? COORDS_MIGRATION_HINT : undefined,
  };
}

