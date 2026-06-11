import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdFormat } from "@/lib/ads-types";
import { DEFAULT_AD_CAMPAIGNS, DEFAULT_AD_SLOTS } from "@/lib/ads-defaults";
import { campaignFormatImagesFromDefaults } from "@/lib/ads-format-images";

export type SeedAdsResult = {
  campaignsInserted: number;
  campaignsSkipped: number;
  slotsUpserted: number;
};

/**
 * Initialise ou met à jour la structure publicitaire sans écraser les visuels
 * déjà téléversés pour une campagne existante.
 */
export async function seedAdsSafe(
  supabase: SupabaseClient,
): Promise<SeedAdsResult> {
  let campaignsInserted = 0;
  let campaignsSkipped = 0;

  for (const c of Object.values(DEFAULT_AD_CAMPAIGNS)) {
    const { data: existing } = await supabase
      .from("ad_campaigns")
      .select("id")
      .eq("id", c.id)
      .maybeSingle();

    if (existing) {
      campaignsSkipped += 1;
      continue;
    }

    const { error } = await supabase.from("ad_campaigns").insert({
      id: c.id,
      name: c.name,
      image: c.image,
      image_width: c.imageWidth,
      image_height: c.imageHeight,
      format_images: campaignFormatImagesFromDefaults(c),
      ad_package: c.adPackage,
      href: c.href,
      alt: c.alt,
      sponsor: c.sponsor ?? null,
      active: c.active,
    });
    if (error) throw new Error(error.message);
    campaignsInserted += 1;
  }

  let slotsUpserted = 0;
  for (const s of DEFAULT_AD_SLOTS) {
    const { error } = await supabase.from("ad_slots").upsert({
      id: s.id,
      label: s.label,
      format: s.format as AdFormat,
      campaign_id: s.campaignId || null,
      enabled: s.enabled !== false,
      sort_order: s.sortOrder ?? 0,
    });
    if (error) throw new Error(error.message);
    slotsUpserted += 1;
  }

  await supabase.from("ad_slots").delete().eq("id", "footer-sponsors");

  return { campaignsInserted, campaignsSkipped, slotsUpserted };
}
