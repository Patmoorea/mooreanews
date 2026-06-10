import type { AdCampaign, AdFormat } from "@/lib/ads-types";

/** Visuel pub pour un emplacement (slot > format > image principale). */
export function getCampaignImageForSlot(
  campaign: AdCampaign,
  format: AdFormat,
  slotId?: string,
): string | null {
  if (slotId && campaign.slotImages?.[slotId]) {
    return campaign.slotImages[slotId];
  }
  return getCampaignImageForFormat(campaign, format);
}

/** Visuel dédié par format IAB — pas de redimensionnement d’une image générique. */
export function getCampaignImageForFormat(
  campaign: AdCampaign,
  format: AdFormat,
): string | null {
  const images = campaign.formatImages;
  if (images?.[format]) return images[format];
  if (format === "sidebar" && images?.rectangle) return images.rectangle;
  if (Object.keys(images ?? {}).length) return null;
  return campaign.image || null;
}
