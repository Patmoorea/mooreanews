import { DEFAULT_AD_CAMPAIGNS } from "@/lib/ads-defaults";
import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";
import type { AdCampaign, AdCampaignRow, AdFormat, AdSlotRow } from "@/lib/ads-types";

export const AD_FORMATS: AdFormat[] = [
  "leaderboard",
  "billboard",
  "rectangle",
  "sidebar",
  "card",
  "ribbon",
];

export function parseFormatImagesJson(
  raw: AdCampaignRow["format_images"],
): Partial<Record<AdFormat, string>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Partial<Record<AdFormat, string>> = {};
  for (const format of AD_FORMATS) {
    const value = (raw as Record<string, unknown>)[format];
    if (typeof value === "string" && value.trim()) {
      out[format] = value.trim();
    }
  }
  return out;
}

/** Fusionne DB + défauts code (la DB gagne). */
export function mergeCampaignFormatImages(
  campaignId: string,
  fromDb: Partial<Record<AdFormat, string>>,
): Partial<Record<AdFormat, string>> | undefined {
  const defaults = DEFAULT_AD_CAMPAIGNS[campaignId]?.formatImages ?? {};
  const merged = { ...defaults, ...fromDb };
  const cleaned = Object.fromEntries(
    Object.entries(merged).filter(([, url]) => typeof url === "string" && url.trim()),
  ) as Partial<Record<AdFormat, string>>;
  return Object.keys(cleaned).length ? cleaned : undefined;
}

export function formatImagesToJson(
  images: Partial<Record<AdFormat, string>>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const format of AD_FORMATS) {
    const url = images[format]?.trim();
    if (url) out[format] = url;
  }
  return out;
}

/** Formats réellement utilisés par les emplacements assignés à cette campagne. */
export function formatsUsedByCampaign(
  campaignId: string,
  slots: Pick<AdSlotRow, "format" | "campaign_id" | "enabled">[],
): AdFormat[] {
  const used = new Set<AdFormat>();
  for (const slot of slots) {
    if (slot.enabled && slot.campaign_id === campaignId) {
      used.add(slot.format);
    }
  }
  return AD_FORMATS.filter((f) => used.has(f));
}

export function pickPrimaryCampaignImage(
  formatImages: Partial<Record<AdFormat, string>>,
): string {
  return (
    formatImages.leaderboard ??
    formatImages.billboard ??
    formatImages.ribbon ??
    formatImages.rectangle ??
    Object.values(formatImages).find(Boolean) ??
    ""
  );
}

export function formatUploadHelp(format: AdFormat): string {
  const spec = AD_FORMAT_DISPLAY[format];
  return `Dimensions exactes : ${spec.width}×${spec.height} px — le site affiche ce fichier tel quel, sans redimensionnement.`;
}

export function campaignFormatImagesFromDefaults(
  campaign: AdCampaign,
): Record<string, string> {
  return formatImagesToJson(campaign.formatImages ?? {});
}
