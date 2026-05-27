import type { CategorySlug } from "@/lib/constants";

/** Chemins `/images/...` du JSON démo sans fichiers dans `public/` */
export function isPlaceholderContentImage(src: string | null | undefined): boolean {
  const t = src?.trim();
  return !t || t.startsWith("/images/");
}

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

/** Couvertures par slug (articles, événements, activités, restaurants) */
export const CONTENT_SLUG_COVERS: Record<string, string> = {
  "moorea-marche-paopao-renouveau":
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop",
  "tortues-temae-recensement-2026":
    "https://images.unsplash.com/photo-1437622368342-7a3f049d9f0c?w=1200&q=80&auto=format&fit=crop",
  "fete-tiare-2026-programme":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80&auto=format&fit=crop",
  "transports-le-truck-nouvelle-ligne":
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80&auto=format&fit=crop",
  "nouveau-medecin-maharepa":
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80&auto=format&fit=crop",
  "lagon-haapiti-zone-protection":
    "https://images.unsplash.com/photo-1583212292454-1fe622ffe3ec?w=1200&q=80&auto=format&fit=crop",
  "marche-artisanal-paopao-juin":
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop",
  "heiva-i-moorea-2026":
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&auto=format&fit=crop",
  "concert-jazz-coucher-soleil":
    "https://images.unsplash.com/photo-1415201364779-f8f0c2c2f0b0?w=1200&q=80&auto=format&fit=crop",
  "course-pirogue-vaiare-paopao":
    "https://images.unsplash.com/photo-1530549380082-4c5a6662f941?w=1200&q=80&auto=format&fit=crop",
  "vide-grenier-maharepa":
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop",
  "atelier-tressage-niau":
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&auto=format&fit=crop",
  "plongee-pointe-tortue":
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80&auto=format&fit=crop",
  "rando-trois-cocotiers":
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop",
  "sortie-lagon-nage-raies-requins":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80&auto=format&fit=crop",
  "rencontre-baleines":
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80&auto=format&fit=crop",
  "visite-distillerie-ananas":
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80&auto=format&fit=crop",
  "kayak-baie-opunohu":
    "https://images.unsplash.com/photo-1544551763-77ef2d0cfcb0?w=1200&q=80&auto=format&fit=crop",
  "chez-tama-hau":
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop",
  "le-mahogany":
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop",
  "snack-mahana":
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80&auto=format&fit=crop",
  "snack-moorea-maitai":
    "https://images.unsplash.com/photo-1550966871-3ed3c47b2c2c?w=1200&q=80&auto=format&fit=crop",
  "moz-pizza-moorea":
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80&auto=format&fit=crop",
  "moorea-beach-cafe":
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80&auto=format&fit=crop",
  "roulotte-vaiare":
    "https://images.unsplash.com/photo-1568901349315-1c2c947f0d65?w=1200&q=80&auto=format&fit=crop",
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
  if (trimmed && !isPlaceholderContentImage(trimmed)) return trimmed;

  const slug = options.slug?.trim();
  if (slug && slug in CONTENT_SLUG_COVERS) {
    return CONTENT_SLUG_COVERS[slug];
  }
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
