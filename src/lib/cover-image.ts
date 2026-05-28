import type { CategorySlug } from "@/lib/constants";

/** Chemins `/images/...` du JSON démo sans fichiers dans `public/`. */
export function isPlaceholderContentImage(
  src: string | null | undefined,
): boolean {
  const t = src?.trim();
  return !t || t.startsWith("/images/");
}

/**
 * Retourne l’URL d’image uniquement si elle est réelle (admin, Supabase, lien externe).
 * Pas de photo Unsplash « décorative » qui ne correspond pas au contenu.
 */
export function resolveCoverImage(options: {
  image?: string | null;
  category?: CategorySlug | string;
  slug?: string;
}): string | null {
  const trimmed = options.image?.trim();
  if (trimmed && !isPlaceholderContentImage(trimmed)) {
    return trimmed;
  }
  return null;
}
