/**
 * Emplacements publicitaires MooreaNews.
 * Données : Supabase (admin) avec repli sur ads-defaults.ts si tables absentes.
 */

export type {
  AdFormat,
  AdCampaign,
  AdSlotDefinition,
  AdCampaignRow,
  AdSlotRow,
} from "@/lib/ads-types";

export { AD_FORMAT_LABELS } from "@/lib/ads-types";
export {
  getAdsConfig,
  resolveAdSlot,
  getActiveSponsorCampaigns,
  listAdCampaignsAdmin,
  listAdSlotsAdmin,
  getAdCampaignAdmin,
} from "@/lib/ads-data";

/** Grille tarifaire indicative pour /partenaires */
export const AD_INVENTORY = [
  {
    slot: "Bandeau principal accueil",
    format: "leaderboard",
    placement: "Sous le hero — visibilité maximale",
    fromXpf: "35 000",
  },
  {
    slot: "Encart accueil (×2)",
    format: "billboard / rectangle",
    placement: "Entre rubriques actualités, agenda, carte",
    fromXpf: "25 000",
  },
  {
    slot: "Actualités & articles",
    format: "leaderboard + encart grille",
    placement: "Liste actualités et fin d'article",
    fromXpf: "20 000",
  },
  {
    slot: "Restaurants & visiteurs",
    format: "leaderboard / billboard",
    placement: "Pages à forte intention (manger, tourisme)",
    fromXpf: "25 000",
  },
  {
    slot: "Bandeau pied de page",
    format: "ribbon",
    placement: "Toutes les pages — présence continue",
    fromXpf: "15 000",
  },
] as const;
