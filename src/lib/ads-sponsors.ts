import type { AdCampaign, AdSlotDefinition } from "@/lib/ads-types";

/** Préfixe des emplacements ruban pied de page (plusieurs campagnes côte à côte). */
export const FOOTER_SPONSOR_SLOT_PREFIX = "footer-sponsors-";

export const MAX_FOOTER_SPONSOR_SLOTS = 10;

export type AdSponsorStripItem = {
  slotId: string;
  campaign: AdCampaign;
};

export function isFooterSponsorSlot(slotId: string): boolean {
  return slotId.startsWith(FOOTER_SPONSOR_SLOT_PREFIX);
}

/** Rubans partenaires affichés ensemble dans le pied de page. */
export function buildFooterSponsorStripItems(
  campaigns: Record<string, AdCampaign>,
  slots: AdSlotDefinition[],
): AdSponsorStripItem[] {
  return slots
    .filter(
      (s) =>
        s.enabled !== false &&
        isFooterSponsorSlot(s.id) &&
        s.format === "ribbon" &&
        s.campaignId,
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((slot) => {
      const campaign = campaigns[slot.campaignId!];
      if (!campaign?.active) return null;
      return { slotId: slot.id, campaign };
    })
    .filter((item): item is AdSponsorStripItem => item !== null);
}
