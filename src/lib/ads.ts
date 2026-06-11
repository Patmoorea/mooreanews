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
  AdPackageId,
} from "@/lib/ads-types";

export { AD_FORMAT_LABELS } from "@/lib/ads-types";
export {
  getAdsConfig,
  resolveAdSlot,
  getFooterSponsorStripItems,
  getActiveSponsorCampaigns,
  listAdCampaignsAdmin,
  listAdSlotsAdmin,
  getAdCampaignAdmin,
} from "@/lib/ads-data";

export type { AdSponsorStripItem } from "@/lib/ads-sponsors";
export { FOOTER_SPONSOR_SLOT_PREFIX, MAX_FOOTER_SPONSOR_SLOTS } from "@/lib/ads-sponsors";
export { AD_ROTATION_MS } from "@/lib/ads-rotate";

export {
  AD_PACKAGES,
  AD_PACKAGE_IDS,
  AD_PLACEMENT_CATALOG,
  formatsForPackage,
  getAdPackage,
} from "@/lib/ad-packages";

import { AD_FORMAT_LABELS } from "@/lib/ads-types";
import { AD_PLACEMENT_CATALOG } from "@/lib/ad-packages";

/** @deprecated Utiliser AD_PLACEMENT_CATALOG */
export const AD_INVENTORY = AD_PLACEMENT_CATALOG.map((row) => ({
  slot: row.label,
  format: `${AD_FORMAT_LABELS[row.format]} (${row.dimensions})`,
  placement: row.zone,
  fromXpf: row.fromXpf,
}));
