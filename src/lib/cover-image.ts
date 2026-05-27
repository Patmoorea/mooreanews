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

/** Couvertures par catégorie d’info pratique */
export const INFO_CATEGORY_COVERS: Record<string, string> = {
  sante:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80&auto=format&fit=crop",
  transport:
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80&auto=format&fit=crop",
  administration:
    "https://images.unsplash.com/photo-1486406146927-c627a92ad1ab?w=1200&q=80&auto=format&fit=crop",
  commerce:
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop",
  urgence:
    "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=1200&q=80&auto=format&fit=crop",
  education:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80&auto=format&fit=crop",
};

/** Couvertures spécifiques (slug) */
export const INFO_SLUG_COVERS: Record<string, string> = {
  "rai-tahiti-vsl":
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&q=80&auto=format&fit=crop",
  "debarcadere-vaiare":
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80&auto=format&fit=crop",
  "aerodrome-temae":
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop",
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
  slug?: string;
}): string {
  const trimmed = options.image?.trim();
  if (trimmed) return trimmed;

  const slug = options.slug?.trim();
  if (slug && slug in INFO_SLUG_COVERS) {
    return INFO_SLUG_COVERS[slug];
  }

  const cat = options.category;
  if (cat && cat in INFO_CATEGORY_COVERS) {
    return INFO_CATEGORY_COVERS[cat];
  }
  if (cat && cat in CATEGORY_COVER_IMAGES) {
    return CATEGORY_COVER_IMAGES[cat as CategorySlug];
  }
  if (cat && cat in EVENT_CATEGORY_COVERS) {
    return EVENT_CATEGORY_COVERS[cat];
  }

  return CATEGORY_COVER_IMAGES.actualites;
}
