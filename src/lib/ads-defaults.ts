import type { AdCampaign, AdSlotDefinition } from "@/lib/ads-types";

const MAITAI = "/images/ads/moorea-maitai/separees";

/** Visuels natifs extraits du composite ChatGPT (sans redimensionnement destructif). */
const B = {
  billboard: `${MAITAI}/moorea-maitai-01-billboard-top-grande.png`,
  skyscraper: `${MAITAI}/moorea-maitai-02-skyscraper-vertical.png`,
  coucher: `${MAITAI}/moorea-maitai-03-rectangle-coucher-soleil.png`,
  reserver: `${MAITAI}/moorea-maitai-04-rectangle-reserver.png`,
  bonsMoments: `${MAITAI}/moorea-maitai-05-bons-moments-reserver.png`,
  leaderboard: `${MAITAI}/moorea-maitai-06-leaderboard-bottom.png`,
  ribbon: `${MAITAI}/moorea-maitai-07-ribbon-footer.png`,
} as const;

export const DEFAULT_AD_CAMPAIGNS: Record<string, AdCampaign> = {
  "moorea-maitai": {
    id: "moorea-maitai",
    name: "Moorea Maitai — Snack Bar",
    image: B.billboard,
    imageWidth: 816,
    imageHeight: 259,
    formatImages: {
      leaderboard: B.leaderboard,
      billboard: B.billboard,
      rectangle: B.coucher,
      sidebar: B.coucher,
      card: B.bonsMoments,
      ribbon: B.ribbon,
    },
    /** Chaque emplacement = visuel différent quand possible (7 créas, 12 slots). */
    slotImages: {
      "home-leaderboard": B.leaderboard,
      "home-articles": B.billboard,
      "home-events": B.coucher,
      "home-map": B.skyscraper,
      "actualites-top": B.reserver,
      "actualites-inline": B.bonsMoments,
      "article-bottom": B.billboard,
      "restaurants-top": B.leaderboard,
      "restaurants-inline": B.reserver,
      "evenements-top": B.skyscraper,
      "visiteurs-mid": B.coucher,
      "footer-sponsors": B.ribbon,
    },
    href: "https://www.facebook.com/profile.php?id=61555377901751",
    alt: "Moorea Maitai Snack Bar — Sunset Beach Maharepa, cuisine locale, tapas, grillades, fruits de mer. 7/7 11h-21h",
    sponsor: "Moorea Maitai",
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
