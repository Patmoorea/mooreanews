import type { AdCampaign, AdSlotDefinition } from "@/lib/ads-types";
import {
  FOOTER_SPONSOR_SLOT_PREFIX,
  MAX_FOOTER_SPONSOR_SLOTS,
} from "@/lib/ads-sponsors";

const IAB_MAITAI = "/images/ads/moorea-maitai";
const IAB_RAI = "/images/ads/rai-tahiti";

/** Visuels exportés aux dimensions IAB exactes (728×90, 970×250, etc.). */
const B = {
  leaderboard: `${IAB_MAITAI}/moorea-maitai-ad-leaderboard-728x90.png`,
  billboard: `${IAB_MAITAI}/moorea-maitai-ad-billboard-970x250.png`,
  rectangle: `${IAB_MAITAI}/moorea-maitai-ad-rectangle-300x250.png`,
  card: `${IAB_MAITAI}/moorea-maitai-ad-card-300x200.png`,
  ribbon: `${IAB_MAITAI}/moorea-maitai-ad-ribbon-468x60.png`,
} as const;

const R = {
  leaderboard: `${IAB_RAI}/rai-tahiti-ad-leaderboard-728x90.png`,
  billboard: `${IAB_RAI}/rai-tahiti-ad-billboard-970x250.png`,
  rectangle: `${IAB_RAI}/rai-tahiti-ad-rectangle-300x250.png`,
  card: `${IAB_RAI}/rai-tahiti-ad-card-300x200.png`,
  ribbon: `${IAB_RAI}/rai-tahiti-ad-ribbon-468x60.png`,
} as const;

/** Campagnes par défaut au ruban pied de page (emplacements 01, 02…). */
const FOOTER_SPONSOR_ASSIGNMENTS: Record<number, string> = {
  1: "moorea-maitai",
  2: "rai-tahiti",
};

function footerSponsorSlotId(index: number): string {
  return `${FOOTER_SPONSOR_SLOT_PREFIX}${String(index).padStart(2, "0")}`;
}

function buildFooterSponsorSlots(): AdSlotDefinition[] {
  return Array.from({ length: MAX_FOOTER_SPONSOR_SLOTS }, (_, i) => {
    const n = i + 1;
    const campaignId = FOOTER_SPONSOR_ASSIGNMENTS[n];
    return {
      id: footerSponsorSlotId(n),
      label: `Pied de page — partenaire ${n} (ruban 468×60)`,
      format: "ribbon",
      campaignId,
      enabled: Boolean(campaignId),
      sortOrder: 200 + n,
    };
  });
}

export const DEFAULT_AD_CAMPAIGNS: Record<string, AdCampaign> = {
  "moorea-maitai": {
    id: "moorea-maitai",
    name: "Moorea Maitai — Snack Bar",
    adPackage: "premium",
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
    href: "https://www.facebook.com/profile.php?id=61555377901751",
    alt: "Moorea Maitai Snack Bar — Sunset Beach Maharepa, cuisine locale, tapas, grillades, fruits de mer. 7/7 11h-21h",
    sponsor: "Moorea Maitai",
    active: true,
  },
  "rai-tahiti": {
    id: "rai-tahiti",
    name: "RAI TAHITI — Transport sanitaire VSL",
    adPackage: "premium",
    image: R.leaderboard,
    imageWidth: 728,
    imageHeight: 90,
    formatImages: {
      leaderboard: R.leaderboard,
      billboard: R.billboard,
      rectangle: R.rectangle,
      sidebar: R.rectangle,
      card: R.card,
      ribbon: R.ribbon,
    },
    href: "https://www.raitahiti.com",
    alt: "RAI TAHITI — transport sanitaire VSL conventionné CPS, Moorea & Tahiti, 7j/7. Moorea 89 77 76 24 · Tahiti 89 41 02 10",
    sponsor: "RAI TAHITI",
    active: true,
  },
};

const PAGE_AD_SLOTS: AdSlotDefinition[] = [
  { id: "home-leaderboard", label: "Accueil — bandeau principal (sous le hero)", format: "leaderboard", enabled: true, sortOrder: 10 },
  { id: "home-articles", label: "Accueil — entre actualités et événements", format: "billboard", enabled: true, sortOrder: 20 },
  { id: "home-events", label: "Accueil — après l'agenda", format: "rectangle", enabled: true, sortOrder: 30 },
  { id: "home-map", label: "Accueil — avant la carte interactive", format: "billboard", enabled: true, sortOrder: 40 },
  { id: "actualites-top", label: "Actualités — haut de liste", format: "leaderboard", enabled: true, sortOrder: 50 },
  { id: "actualites-inline", label: "Actualités — encart dans la grille", format: "card", enabled: true, sortOrder: 60 },
  { id: "article-bottom", label: "Article — sous le contenu", format: "billboard", enabled: true, sortOrder: 70 },
  { id: "restaurants-top", label: "Restaurants — haut de page", format: "leaderboard", enabled: true, sortOrder: 80 },
  { id: "restaurants-inline", label: "Restaurants — encart dans la liste", format: "rectangle", enabled: true, sortOrder: 90 },
  { id: "evenements-top", label: "Événements — haut de page", format: "billboard", enabled: true, sortOrder: 100 },
  { id: "visiteurs-mid", label: "Visiteurs — bandeau partenaire", format: "leaderboard", enabled: true, sortOrder: 110 },
  { id: "sante-garde-mid", label: "Santé / garde — bandeau partenaire", format: "leaderboard", enabled: true, sortOrder: 115 },
];

/** Emplacements page + jusqu'à 10 rubans partenaires en pied de page. */
export const DEFAULT_AD_SLOTS: AdSlotDefinition[] = [
  ...PAGE_AD_SLOTS,
  ...buildFooterSponsorSlots(),
];
