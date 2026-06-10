import type { AdCampaign, AdSlotDefinition } from "@/lib/ads-types";
import { listActiveCampaigns } from "@/lib/ads-rotate";

/** Préfixe des emplacements ruban pied de page (plusieurs campagnes côte à côte). */
export const FOOTER_SPONSOR_SLOT_PREFIX = "footer-sponsors-";

export const LEGACY_FOOTER_SPONSOR_SLOT = "footer-sponsors";

export const MAX_FOOTER_SPONSOR_SLOTS = 10;

export type AdSponsorStripItem = {
  slotId: string;
  campaign: AdCampaign;
};

export function isFooterSponsorSlot(slotId: string): boolean {
  return (
    slotId.startsWith(FOOTER_SPONSOR_SLOT_PREFIX) ||
    slotId === LEGACY_FOOTER_SPONSOR_SLOT ||
    slotId.startsWith("footer-auto-")
  );
}

/** Rubans partenaires affichés ensemble dans le pied de page. */
export function buildFooterSponsorStripItems(
  campaigns: Record<string, AdCampaign>,
  slots: AdSlotDefinition[],
): AdSponsorStripItem[] {
  const numbered = slots
    .filter(
      (s) =>
        s.enabled !== false &&
        s.id.startsWith(FOOTER_SPONSOR_SLOT_PREFIX) &&
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

  if (numbered.length > 0) return numbered;

  const legacy = slots.find(
    (s) => s.id === LEGACY_FOOTER_SPONSOR_SLOT && s.enabled !== false && s.campaignId,
  );
  if (legacy) {
    const campaign = campaigns[legacy.campaignId!];
    if (campaign?.active) {
      return [{ slotId: legacy.id, campaign }];
    }
  }

  /** Repli : toutes les campagnes actives côte à côte (aucune config pied de page requise). */
  return listActiveCampaigns(campaigns).map((campaign) => ({
    slotId: `footer-auto-${campaign.id}`,
    campaign,
  }));
}
