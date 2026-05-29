import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type InfoPratiqueRowInput = {
  title: string;
  description: string;
  category: string;
  display_order: number;
  address: string | null;
  phone: string | null;
  hours: string | null;
  url: string | null;
  lat: number | null;
  lon: number | null;
  published: boolean;
  emergency: boolean;
};

const COORDS_MIGRATION_HINT =
  "Exécutez supabase/info-pratiques-coords.sql dans Supabase → SQL Editor pour activer la carte GPS.";

function isMissingCoordsColumnError(message: string): boolean {
  return (
    /schema cache/i.test(message) &&
    (/\blat\b/i.test(message) || /\blon\b/i.test(message))
  );
}

export function stripInfoCoords(
  row: InfoPratiqueRowInput,
): Omit<InfoPratiqueRowInput, "lat" | "lon"> {
  const { lat: _lat, lon: _lon, ...rest } = row;
  return rest;
}

/** Insert avec repli si lat/lon absents de la table Supabase (ancienne base). */
export async function insertInfoPratiqueRow(
  supabase: SupabaseClient<Database>,
  row: InfoPratiqueRowInput,
): Promise<{ error: string | null; legacySchema: boolean }> {
  const { error } = await supabase.from("info_pratiques").insert(row);
  if (!error) return { error: null, legacySchema: false };

  if (isMissingCoordsColumnError(error.message)) {
    const { error: legacyError } = await supabase
      .from("info_pratiques")
      .insert(stripInfoCoords(row));
    if (legacyError) return { error: legacyError.message, legacySchema: true };
    return {
      error: null,
      legacySchema: true,
    };
  }

  return { error: error.message, legacySchema: false };
}

/** Update avec repli si lat/lon absents de la table Supabase. */
export async function updateInfoPratiqueRow(
  supabase: SupabaseClient<Database>,
  id: string,
  row: Partial<InfoPratiqueRowInput>,
): Promise<{ error: string | null; legacySchema: boolean }> {
  const { error } = await supabase
    .from("info_pratiques")
    .update(row)
    .eq("id", id);
  if (!error) return { error: null, legacySchema: false };

  if (isMissingCoordsColumnError(error.message)) {
    const { lat: _lat, lon: _lon, ...rest } = row;
    const { error: legacyError } = await supabase
      .from("info_pratiques")
      .update(rest)
      .eq("id", id);
    if (legacyError) return { error: legacyError.message, legacySchema: true };
    return { error: null, legacySchema: true };
  }

  return { error: error.message, legacySchema: false };
}

export { COORDS_MIGRATION_HINT };
