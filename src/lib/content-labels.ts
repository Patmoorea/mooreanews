import type { Activity, Announcement, InfoPratique } from "@/lib/content-types";

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
