import type { AdCampaign, AdSlotDefinition } from "@/lib/ads-types";

const IAB_MAITAI = "/images/ads/moorea-maitai";
const IAB_RAI = "/images/ads/rai-tahiti";

/** Visuels exportés aux dimensions IAB exactes (728×90, 970×250, etc.). */
const B = {
  leaderboard: `${IAB_MAITAI}/moorea-maitai-ad-leaderboard-728x90.png`,
  billboard: `${IAB_MAITAI}/moorea-maitai-ad-billboard-970x250.png`,
  billboardSunset: `${IAB_MAITAI}/moorea-maitai-ad-billboard-sunset-970x250.png`,
  rectangle: `${IAB_MAITAI}/moorea-maitai-ad-rectangle-300x250.png`,
  rectangleCompact: `${IAB_MAITAI}/moorea-maitai-ad-rectangle-compact-300x250.png`,
  card: `${IAB_MAITAI}/moorea-maitai-ad-card-300x200.png`,
  ribbon: `${IAB_MAITAI}/moorea-maitai-ad-ribbon-468x60.png`,
} as const;

const R = {
  leaderboard: `${IAB_RAI}/rai-tahiti-ad-leaderboard-728x90.png`,
  billboard: `${IAB_RAI}/rai-tahiti-ad-billboard-970x250.png`,
  billboardOcean: `${IAB_RAI}/rai-tahiti-ad-billboard-ocean-970x250.png`,
  rectangle: `${IAB_RAI}/rai-tahiti-ad-rectangle-300x250.png`,
  rectangleCompact: `${IAB_RAI}/rai-tahiti-ad-rectangle-compact-300x250.png`,
  card: `${IAB_RAI}/rai-tahiti-ad-card-300x200.png`,
  ribbon: `${IAB_RAI}/rai-tahiti-ad-ribbon-468x60.png`,
} as const;

export const DEFAULT_AD_CAMPAIGNS: Record<string, AdCampaign> = {
  "moorea-maitai": {
    id: "moorea-maitai",
    name: "Moorea Maitai — Snack Bar",
    image: B.billboard,
    imageWidth: 970,
    imageHeight: 250,
    formatImages: {
      leaderboard: B.leaderboard,
      billboard: B.billboard,
      rectangle: B.rectangle,
      sidebar: B.rectangle,
      card: B.card,
      ribbon: B.ribbon,
    },
    slotImages: {
      "home-leaderboard": B.leaderboard,
      "home-articles": B.billboard,
      "home-events": B.rectangle,
      "home-map": B.billboardSunset,
      "actualites-top": B.leaderboard,
      "actualites-inline": B.card,
      "article-bottom": B.billboardSunset,
      "restaurants-top": B.leaderboard,
      "restaurants-inline": B.rectangleCompact,
      "evenements-top": B.billboard,
      "visiteurs-mid": B.rectangle,
      "footer-sponsors": B.ribbon,
    },
    href: "https://www.facebook.com/profile.php?id=61555377901751",
    alt: "Moorea Maitai Snack Bar — Sunset Beach Maharepa, cuisine locale, tapas, grillades, fruits de mer. 7/7 11h-21h",
    sponsor: "Moorea Maitai",
    active: true,
  },
  "rai-tahiti": {
    id: "rai-tahiti",
    name: "RAI TAHITI — Transport sanitaire VSL",
    image: R.billboard,
    imageWidth: 970,
    imageHeight: 250,
    formatImages: {
      leaderboard: R.leaderboard,
      billboard: R.billboard,
      rectangle: R.rectangle,
      sidebar: R.rectangle,
      card: R.card,
      ribbon: R.ribbon,
    },
    slotImages: {
      "home-leaderboard": R.leaderboard,
      "home-articles": R.billboard,
      "home-events": R.rectangle,
      "home-map": R.billboardOcean,
      "actualites-top": R.leaderboard,
      "actualites-inline": R.card,
      "article-bottom": R.billboardOcean,
      "restaurants-top": R.leaderboard,
      "restaurants-inline": R.rectangleCompact,
      "evenements-top": R.billboard,
      "visiteurs-mid": R.rectangle,
      "footer-sponsors": R.ribbon,
    },
    href: "https://www.raitahiti.com",
    alt: "RAI TAHITI — transport sanitaire VSL conventionné CPS, Moorea & Tahiti, 7j/7. Moorea 89 77 76 24 · Tahiti 89 41 02 10",
    sponsor: "RAI TAHITI",
    active: true,
  },
};

export const DEFAULT_AD_SLOTS: AdSlotDefinition[] = [
  { id: "home-leaderboard", label: "Accueil — bandeau principal (sous le hero)", format: "leaderboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 10 },
  { id: "home-articles", label: "Accueil — entre actualités et événements", format: "billboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 20 },
  { id: "home-events", label: "Accueil — après l'agenda", format: "rectangle", campaignId: "moorea-maitai", enabled: true, sortOrder: 30 },
  { id: "home-map", label: "Accueil — avant la carte interactive", format: "billboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 40 },
  { id: "actualites-top", label: "Actualités — haut de liste", format: "leaderboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 50 },
  { id: "actualites-inline", label: "Actualités — encart dans la grille", format: "card", campaignId: "moorea-maitai", enabled: true, sortOrder: 60 },
  { id: "article-bottom", label: "Article — sous le contenu", format: "billboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 70 },
  { id: "restaurants-top", label: "Restaurants — haut de page", format: "leaderboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 80 },
  { id: "restaurants-inline", label: "Restaurants — encart dans la liste", format: "rectangle", campaignId: "moorea-maitai", enabled: true, sortOrder: 90 },
  { id: "evenements-top", label: "Événements — haut de page", format: "billboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 100 },
  { id: "visiteurs-mid", label: "Visiteurs — milieu de page", format: "billboard", campaignId: "moorea-maitai", enabled: true, sortOrder: 110 },
  { id: "footer-sponsors", label: "Pied de page — bandeau partenaires", format: "ribbon", campaignId: "moorea-maitai", enabled: true, sortOrder: 120 },
];
