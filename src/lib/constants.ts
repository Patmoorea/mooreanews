/** Configuration globale de Moorea Hub */

export const SITE = {
  name: "Moorea Hub",
  tagline: "Le portail de l'île de Moorea",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mooreanews.com",
  email: "contact@mooreanews.com",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
  },
} as const;

/** Coordonnées géographiques de Moorea (Papetoai, centre approximatif) */
export const MOOREA_COORDS = {
  lat: -17.5,
  lon: -149.83,
} as const;

/** Coordonnées du quai de Vai'are (départ ferries) */
export const VAIARE_COORDS = {
  lat: -17.5167,
  lon: -149.7833,
} as const;

export const LOCALES = ["fr", "en", "ty"] as const;
export const LOCALE_LABELS: Record<(typeof LOCALES)[number], string> = {
  fr: "Français",
  en: "English",
  ty: "Reo Tahiti",
};
export const LOCALE_FLAGS: Record<(typeof LOCALES)[number], string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  ty: "🌺",
};

/** Catégories de soumission utilisateur */
export const SUBMISSION_TYPES = [
  "event",
  "announcement",
  "restaurant",
  "activity",
] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

/** Catégories d'articles / actualités */
export const ARTICLE_CATEGORIES = [
  "news",
  "culture",
  "sport",
  "environment",
  "community",
  "tourism",
  "education",
  "health",
] as const;
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];
