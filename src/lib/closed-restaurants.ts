/**
 * Établissements fermés définitivement — masqués du site même si encore en base.
 * Ajouter ici après vérification locale (slug JSON ou nom en base Supabase).
 */

const CLOSED_SLUGS = new Set<string>(["le-mahogany"]);

const CLOSED_NAME_KEYS = new Set<string>(["le mahogany"]);

export function isClosedRestaurant(entry: {
  slug: string;
  name: string;
}): boolean {
  if (CLOSED_SLUGS.has(entry.slug)) return true;
  return CLOSED_NAME_KEYS.has(entry.name.trim().toLowerCase());
}
