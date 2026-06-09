import type { AdCampaign, AdFormat } from "@/lib/ads-types";

/** Visuel pub pour un emplacement (slot > format > image principale). */
export function getCampaignImageForSlot(
  campaign: AdCampaign,
  format: AdFormat,
  slotId?: string,
): string {
  if (slotId && campaign.slotImages?.[slotId]) {
    return campaign.slotImages[slotId];
  }
  return getCampaignImageForFormat(campaign, format);
}

/** Visuel dédié par format IAB. */
export function getCampaignImageForFormat(
  campaign: AdCampaign,
  format: AdFormat,
): string {
  const dedicated = campaign.formatImages?.[format];
  if (dedicated) return dedicated;
  if (format === "sidebar") {
    return campaign.formatImages?.rectangle ?? campaign.image;
  }
  return campaign.image;
}
