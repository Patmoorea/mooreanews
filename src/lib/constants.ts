/**
 * Constantes globales du site MooreaNews.
 */

export const SITE = {
  name: "MooreaNews",
  tagline: "L'info de Moorea et de la Polynésie française",
  motto: "Votre source d'information locale et fiable",
  description:
    "L'info de Moorea et de la Polynésie française : actualités locales, vie locale & société, tourisme & loisirs, événements & culture, infos pratiques. Météo, ferries, marées en temps réel.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mooreanews.com",
  locale: "fr_PF",
  timezone: "Pacific/Tahiti",
  email: "contact@mooreanews.com",
  copyright: "© 2026 MooreaNews. Tous droits réservés.",
  logo: "/brand/logo.png",
  banner: "/brand/banner.png",
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/MooreaNews",
  instagram: "https://www.instagram.com/mooreanews",
  whatsapp: "+68987654321",
} as const;

/** Coordonnées géographiques de Moorea (centre) */
export const MOOREA_COORDS = {
  lat: -17.5388,
  lon: -149.8295,
} as const;

/** Coordonnées de Papeete (Tahiti) */
export const PAPEETE_COORDS = {
  lat: -17.5516,
  lon: -149.5585,
} as const;

/** Catégories d'articles / contenu */
export const CATEGORIES = [
  { slug: "actualites", label: "Actualités", color: "ocean", icon: "newspaper" },
  { slug: "evenements", label: "Événements", color: "tiare", icon: "calendar" },
  { slug: "annonces", label: "Annonces", color: "soleil", icon: "tag" },
  { slug: "restaurants", label: "Restaurants", color: "couchant", icon: "utensils" },
  { slug: "activites", label: "Activités", color: "tipanier", icon: "compass" },
  { slug: "infos-pratiques", label: "Infos pratiques", color: "lagon", icon: "info" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

/** Navigation principale */
export const NAV_ITEMS = [
  { href: "/", label: "Accueil" },
  { href: "/actualites", label: "Actualités" },
  { href: "/evenements", label: "Événements" },
  { href: "/annonces", label: "Annonces" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/activites", label: "Activités" },
  { href: "/infos-pratiques", label: "Infos pratiques" },
] as const;

/** Quartiers / districts de Moorea */
export const MOOREA_DISTRICTS = [
  "Afareaitu",
  "Haapiti",
  "Maatea",
  "Maharepa",
  "Papetoai",
  "Paopao",
  "Teavaro",
  "Temae",
  "Tiahura",
  "Vaiare",
] as const;

/** Bandeau d'info en haut de site (modifiable) */
export const INFO_BANNER = {
  enabled: false,
  message: "",
  href: "",
  variant: "info" as "info" | "warning" | "alert",
} as const;

/** Liens utiles affichés en footer / page infos pratiques */
export const USEFUL_LINKS = [
  {
    title: "Mairie de Moorea-Maiao",
    href: "https://www.mairie-moorea.pf",
    description: "Site officiel de la commune",
  },
  {
    title: "Horaires Tahiti",
    href: "https://www.horaires-tahiti.com",
    description: "Ferries Aremiti, Terevau et autres",
  },
  {
    title: "Météo France Polynésie",
    href: "https://meteo.pf",
    description: "Prévisions officielles",
  },
  {
    title: "CPS",
    href: "https://www.cps.pf",
    description: "Caisse de Prévoyance Sociale",
  },
  {
    title: "Présidence Polynésie française",
    href: "https://www.presidence.pf",
    description: "Communiqués officiels",
  },
] as const;

/** Configuration API externes (chargées via env) */
export const ENV = {
  openWeatherMapKey:
    process.env.OPENWEATHERMAP_API_KEY ??
    process.env.OPENWEATHER_API_KEY ??
    "",
  resendKey: process.env.RESEND_API_KEY ?? "",
  resendFrom: process.env.RESEND_FROM ?? "MooreaNews <hello@mooreanews.com>",
  resendAdmin:
    process.env.RESEND_ADMIN ??
    process.env.CONTACT_TO_EMAIL ??
    "admin@mooreanews.com",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;
