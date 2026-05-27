/**
 * Constantes globales du site MooreaNews.
 */

/** Email affiché (mailto, footer, contact) — jamais contact@ */
export const SITE_EMAIL =
  process.env.NEXT_PUBLIC_SITE_EMAIL?.trim() || "postmaster@mooreanews.com";

export const SITE = {
  name: "MooreaNews",
  tagline: "L'info de Moorea en Polynésie française",
  heroLead:
    "Actualités locales, vie locale & société, tourisme & loisirs, événements & culture, infos pratiques. Météo, ferries et marées en temps réel.",
  motto: "Votre source d'information locale et fiable",
  description:
    "L'info de Moorea en Polynésie française : actualités locales, vie locale & société, tourisme & loisirs, événements & culture, infos pratiques. Météo, ferries et marées en temps réel.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mooreanews.com",
  locale: "fr_PF",
  timezone: "Pacific/Tahiti",
  email: SITE_EMAIL,
  copyright: "© 2026 MooreaNews. Tous droits réservés.",
  logo: "/brand/logo.png",
  banner: "/brand/banner.png",
  /** Fond du menu principal (pleine largeur) */
  navBanner: "/brand/nav-banner.png",
} as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/JourdanPatrice/",
  instagram: "https://www.instagram.com/mooreanews",
  whatsapp: "+689 89 410 211",
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
  { href: "/partenaires", label: "Partenaires" },
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

/** Bandeau d'info en haut de site (configurable via env sur Vercel) */
export function getInfoBannerConfig() {
  const variant = process.env.INFO_BANNER_VARIANT;
  const validVariant =
    variant === "warning" || variant === "alert" ? variant : "info";

  return {
    enabled: process.env.INFO_BANNER_ENABLED === "true",
    message: process.env.INFO_BANNER_MESSAGE ?? "",
    href: process.env.INFO_BANNER_HREF ?? "",
    variant: validVariant as "info" | "warning" | "alert",
  };
}

/**
 * Groupes et pages utiles (Facebook, annuaires…).
 * La veille cron sonde aussi ces pages (Open Graph + API Meta optionnelle).
 */
export const MOOREA_COMMUNITY_LINKS = [
  {
    title: "Commune de Moorea-Maiao (Facebook)",
    href: "https://www.facebook.com/CommuneMooreaMaiao",
    description: "Actualités officielles de la commune.",
  },
  {
    title: "Groupe Facebook communautaire",
    href: "https://www.facebook.com/groups/461940821326616/",
    description:
      "Fil d’actus et entraide locale — repéré par la veille MooreaNews.",
  },
  {
    title: "Moorea.life — annuaire & événements",
    href: "https://moorea.life/",
    description:
      "Agenda, commerces et événements (souvent synchronisés depuis Facebook).",
  },
  {
    title: "Horaires Tahiti — ferries",
    href: "https://www.horaires-tahiti.com",
    description: "Aremiti, Terevau : Tahiti ↔ Moorea.",
  },
  {
    title: "RAI TAHITI — transport sanitaire (VSL)",
    href: "https://raitahiti.com",
    description:
      "Ambulance conventionnée CPS, Moorea ↔ Tahiti, 7j/7 — 89 77 76 24 (Moorea).",
  },
] as const;

/**
 * Associations & collectifs qui œuvrent pour Moorea.
 * (Affiché sur Infos pratiques)
 */
export const MOOREA_ASSOCIATIONS = [
  {
    title: "Fédération Tāhei’Autī ia Mo’orea",
    href: "https://taheiautiiamoorea.org/",
    description:
      "Fédération de collectifs (culture, environnement, pêche, sport) pour la protection de Moorea-Maiao.",
  },
  {
    title: "Puna Reo Piha’e’ina",
    href: "https://www.punareo.pf/",
    description:
      "Culture et reo mā’ohi à Pihaena : accompagnement des jeunes, ateliers et transmission (Moorea).",
  },
  {
    title: "Te mana o te moana",
    href: "https://www.temanaotemoana.org/",
    description:
      "Protection du milieu marin et des tortues — actions à Moorea depuis 2004 (éducation, soins, recherche).",
  },
  {
    title: "Association PGEM Moorea",
    href: "https://pgem.org/",
    description:
      "Application du plan de gestion du lagon : zones protégées, signalétique, brigade nautique.",
  },
  {
    title: "Moorea Biodiversité",
    href: "https://www.anavai.org/association/74",
    description:
      "Forêts et vallée d’Opunohu : lutte contre les espèces invasives, sensibilisation scolaire, bénévolat.",
  },
  {
    title: "Association des habitants de Temae",
    href: "https://taheiautiiamoorea.org/",
    description:
      "Collectif citoyen pour la préservation de la plage et du site de Temae (membre de Tāhei’Autī).",
  },
] as const;

/** Partenaire santé / transport — mis en avant sur le site */
export const RAI_TAHITI = {
  name: "RAI TAHITI",
  tagline: "Transport sanitaire VSL — Moorea & Tahiti",
  siteUrl: "https://raitahiti.com",
  infoSlug: "rai-tahiti-vsl",
  infoPath: "/infos-pratiques/rai-tahiti-vsl",
  phoneMoorea: "89 77 76 24",
  phoneTahiti: "89 41 02 10",
  phoneHref: "tel:+68989777624",
} as const;

/** Liens utiles affichés en footer / page infos pratiques */
export const USEFUL_LINKS = [
  {
    title: "RAI TAHITI — ambulance VSL",
    href: "https://raitahiti.com",
    description: "Transport sanitaire Moorea ↔ Tahiti, 7j/7",
  },
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
  resendFrom:
    process.env.RESEND_FROM ?? "MooreaNews <postmaster@mooreanews.com>",
  resendAdmin:
    process.env.RESEND_ADMIN ??
    process.env.CONTACT_TO_EMAIL ??
    "postmaster@mooreanews.com",
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;
