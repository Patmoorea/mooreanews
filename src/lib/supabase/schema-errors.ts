/** Détecte une table/colonne absente du cache schéma PostgREST (Supabase). */
export function isMissingSchemaError(message: string, identifier: string): boolean {
  return (
    /schema cache/i.test(message) &&
    new RegExp(`\\b${identifier}\\b`, "i").test(message)
  );
}

export const ACCOMMODATIONS_TABLE_HINT =
  "La table public.accommodations n’existe pas encore. Supabase → SQL Editor → exécutez le fichier supabase/accommodations.sql (ou prod-setup-all.sql), puis rechargez cette page.";
