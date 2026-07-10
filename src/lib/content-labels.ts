import { CATEGORIES, type CategorySlug } from "@/lib/constants";
import type { Activity, Announcement, Event, InfoPratique } from "@/lib/content-types";

const ANNOUNCEMENT_TYPES = [
  "vente",
  "achat",
  "location",
  "emploi",
  "service",
  "perdu-trouve",
  "covoiturage",
] as const satisfies readonly Announcement["type"][];

/** Catégories legacy / admin → type affichable sur le site. */
export function normalizeAnnouncementType(
  category: string | null | undefined,
): Announcement["type"] {
  const raw = (category ?? "").trim().toLowerCase();
  if ((ANNOUNCEMENT_TYPES as readonly string[]).includes(raw)) {
    return raw as Announcement["type"];
  }
  switch (raw) {
    case "services":
    case "general":
    case "communaute":
      return "service";
    default:
      return "service";
  }
}

export function getAnnouncementTypeMeta(type: Announcement["type"]) {
  return ANNOUNCEMENT_TYPE_LABELS[type] ?? ANNOUNCEMENT_TYPE_LABELS.service;
}

const EVENT_CATEGORIES = [
  "musique",
  "marche",
  "sport",
  "fete",
  "culture",
  "autre",
] as const satisfies readonly Event["category"][];

/** Catégories legacy (ex. communaute) → catégorie agenda valide. */
export function normalizeEventCategory(
  category: string | null | undefined,
): Event["category"] {
  const raw = (category ?? "").trim().toLowerCase();
  if ((EVENT_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as Event["category"];
  }
  if (raw === "communaute" || raw === "community") return "autre";
  return "autre";
}

export const EVENT_CATEGORY_VARIANTS: Record<
  Event["category"],
  "tiare" | "soleil" | "tipanier" | "couchant" | "ocean" | "neutral"
> = {
  musique: "tiare",
  marche: "soleil",
  sport: "tipanier",
  fete: "couchant",
  culture: "ocean",
  autre: "neutral",
};

export function getEventCategoryVariant(category: Event["category"]) {
  return EVENT_CATEGORY_VARIANTS[category] ?? "neutral";
}

const ARTICLE_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

/** Catégorie article inconnue → actualités (évite un crash d’affichage). */
export function normalizeArticleCategory(
  category: string | null | undefined,
): CategorySlug {
  const raw = (category ?? "").trim().toLowerCase();
  if (ARTICLE_CATEGORY_SLUGS.includes(raw as CategorySlug)) {
    return raw as CategorySlug;
  }
  return "actualites";
}

export const ANNOUNCEMENT_TYPE_LABELS: Record<
  Announcement["type"],
  { label: string; variant: "tipanier" | "lagon" | "ocean" | "tiare" | "soleil" | "couchant" }
> = {
  vente: { label: "À vendre", variant: "tipanier" },
  achat: { label: "Recherche", variant: "lagon" },
  location: { label: "Location", variant: "ocean" },
  emploi: { label: "Emploi", variant: "tiare" },
  service: { label: "Service", variant: "soleil" },
  "perdu-trouve": { label: "Perdu/Trouvé", variant: "couchant" },
  covoiturage: { label: "Covoiturage", variant: "lagon" },
};

export const ACTIVITY_CATEGORY_LABELS: Record<Activity["category"], string> = {
  plongee: "Plongée",
  randonnee: "Randonnée",
  lagon: "Lagon",
  culture: "Culture",
  nature: "Nature",
  sport: "Sport",
  famille: "Famille",
};

export const INFO_CATEGORY_LABELS: Record<InfoPratique["category"], string> = {
  sante: "Santé",
  transport: "Transports",
  administration: "Administration",
  commerce: "Commerces",
  urgence: "Urgences",
  education: "Éducation",
};

/** Niveau de prix 1–4 (indicatif, pas une devise — en Polynésie : XPF sur place). */
export const RESTAURANT_PRICE_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Économique",
  2: "Modéré",
  3: "Standing",
  4: "Gastronomique",
};

export function getRestaurantPriceLevelDisplay(level: 1 | 2 | 3 | 4) {
  return {
    filled: level,
    label: RESTAURANT_PRICE_LABELS[level],
    ariaLabel: `Niveau de prix : ${RESTAURANT_PRICE_LABELS[level]} (${level} sur 4)`,
    title: `${RESTAURANT_PRICE_LABELS[level]} — échelle indicative (tarifs en franc CFP / XPF sur place)`,
    /** Pour JSON-LD (convention internationale, pas l’euro). */
    schemaPriceRange: "$".repeat(level),
  };
}
