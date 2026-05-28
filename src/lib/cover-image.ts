import type { CategorySlug } from "@/lib/constants";

/**
 * Chemins du JSON démo référencés sans fichier dans `public/`.
 * Les autres `/images/...` (ex. affiche ICPF) sont de vrais fichiers locaux.
 */
const DEMO_PATHS_WITHOUT_FILE = new Set([
  "/images/articles/marche-paopao.jpg",
  "/images/articles/tortues-temae.jpg",
  "/images/articles/fete-tiare.jpg",
  "/images/articles/le-truck.jpg",
  "/images/articles/medecin.jpg",
  "/images/articles/lagon-haapiti.jpg",
  "/images/events/marche-paopao.jpg",
  "/images/events/heiva.jpg",
  "/images/events/jazz-sunset.jpg",
  "/images/events/va-a.jpg",
  "/images/events/vide-grenier.jpg",
  "/images/events/tressage.jpg",
  "/images/restaurants/tama-hau.jpg",
  "/images/restaurants/mahogany.jpg",
  "/images/restaurants/mahana.jpg",
  "/images/restaurants/moorea-maitai.jpg",
  "/images/restaurants/moz-pizza.jpg",
  "/images/restaurants/beach-cafe.jpg",
  "/images/restaurants/roulotte.jpg",
  "/images/activities/plongee.jpg",
  "/images/activities/trois-cocotiers.jpg",
  "/images/activities/lagon-tour.jpg",
  "/images/activities/baleines.jpg",
  "/images/activities/distillerie.jpg",
  "/images/activities/kayak.jpg",
]);

export function isPlaceholderContentImage(
  src: string | null | undefined,
): boolean {
  const t = src?.trim();
  if (!t) return true;
  if (t.startsWith("http://") || t.startsWith("https://")) return false;
  if (t.startsWith("/images/")) {
    return DEMO_PATHS_WITHOUT_FILE.has(t);
  }
  return false;
}

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

/** Normalise un titre pour recherche (minuscules, sans accents). */
export function normalizeTitleKey(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
