import type { AdCampaign, AdFormat } from "@/lib/ads-types";

/** Visuel pub pour un emplacement (format IAB d’abord, override par slot optionnel). */
export function getCampaignImageForSlot(
  campaign: AdCampaign,
  format: AdFormat,
  slotId?: string,
): string | null {
  const fromFormat = getCampaignImageForFormat(campaign, format);
  if (fromFormat) return fromFormat;
  if (slotId && campaign.slotImages?.[slotId]) {
    return campaign.slotImages[slotId];
  }
  return null;
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
