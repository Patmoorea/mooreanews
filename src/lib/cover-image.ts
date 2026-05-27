import type { CategorySlug } from "@/lib/constants";

/** Images par défaut (Unsplash, libres) quand aucune couverture n’est définie. */
export const CATEGORY_COVER_IMAGES: Record<CategorySlug, string> = {
  actualites:
    "https://images.unsplash.com/photo-1589199504165-001c62e3cec8?w=1200&q=80&auto=format&fit=crop",
  evenements:
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80&auto=format&fit=crop",
  annonces:
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop",
  restaurants:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop",
  activites:
    "https://images.unsplash.com/photo-1544551763-77ef2d0cfcb0?w=1200&q=80&auto=format&fit=crop",
  "infos-pratiques":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop",
};

const EVENT_CATEGORY_COVERS: Record<string, string> = {
  musique: CATEGORY_COVER_IMAGES.evenements,
  marche: CATEGORY_COVER_IMAGES.annonces,
  sport: "https://images.unsplash.com/photo-1530549380082-4c5a6662f941?w=1200&q=80&auto=format&fit=crop",
  fete: CATEGORY_COVER_IMAGES.evenements,
  culture: CATEGORY_COVER_IMAGES.evenements,
  autre: CATEGORY_COVER_IMAGES.evenements,
};

export function resolveCoverImage(options: {
  image?: string | null;
  category?: CategorySlug | string;
}): string {
  const trimmed = options.image?.trim();
  if (trimmed) return trimmed;

  const cat = options.category;
  if (cat && cat in CATEGORY_COVER_IMAGES) {
    return CATEGORY_COVER_IMAGES[cat as CategorySlug];
  }
  if (cat && cat in EVENT_CATEGORY_COVERS) {
    return EVENT_CATEGORY_COVERS[cat];
  }

  return CATEGORY_COVER_IMAGES.actualites;
}
