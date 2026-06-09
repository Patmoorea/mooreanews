import type { AdCampaign, AdFormat } from "@/lib/ads-types";

/** Visuels dédiés par format IAB (dimensions natives, sans recadrage). */
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
