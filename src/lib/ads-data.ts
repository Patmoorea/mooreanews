import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  DEFAULT_AD_CAMPAIGNS,
  DEFAULT_AD_SLOTS,
} from "@/lib/ads-defaults";
import {
  DEFAULT_CAMPAIGN_PACKAGE,
  campaignCanUseSlot,
  getAdPackage,
} from "@/lib/ad-packages";
import {
  mergeCampaignFormatImages,
  parseFormatImagesJson,
} from "@/lib/ads-format-images";
import {
  buildFooterSponsorStripItems,
  type AdSponsorStripItem,
} from "@/lib/ads-sponsors";
import { listActiveCampaigns, pickRotatingCampaign } from "@/lib/ads-rotate";
import type {
  AdCampaign,
  AdCampaignRow,
  AdFormat,
  AdSlotDefinition,
  AdSlotRow,
} from "@/lib/ads-types";

export type AdsConfig = {
  campaigns: Record<string, AdCampaign>;
  slots: AdSlotDefinition[];
  source: "database" | "defaults";
};

function campaignFromRow(row: AdCampaignRow): AdCampaign {
  const defaults = DEFAULT_AD_CAMPAIGNS[row.id];
  const fromDb = parseFormatImagesJson(row.format_images);
  const formatImages = mergeCampaignFormatImages(row.id, fromDb);
  const image = row.image?.trim() || defaults?.image || formatImages?.leaderboard || "";
  const adPackage =
    (row.ad_package as AdCampaign["adPackage"]) ||
    defaults?.adPackage ||
    DEFAULT_CAMPAIGN_PACKAGE[row.id] ||
    "cible";
  return {
    id: row.id,
    name: row.name,
    adPackage,
    image,
    imageWidth: row.image_width || defaults?.imageWidth || 728,
    imageHeight: row.image_height || defaults?.imageHeight || 90,
    formatImages,
    href: row.href,
    alt: row.alt,
    sponsor: row.sponsor ?? undefined,
    active: row.active,
  };
}

function slotFromRow(row: AdSlotRow): AdSlotDefinition | null {
  if (!row.enabled) return null;
  return {
    id: row.id,
    label: row.label,
    format: row.format,
    campaignId: row.campaign_id ?? undefined,
    enabled: row.enabled,
    sortOrder: row.sort_order,
  };
}

export const ADS_CONFIG_CACHE_TAG = "ads-config";

async function fetchFromDatabaseUncached(): Promise<AdsConfig | null> {
  const supabase = (await getServerSupabase()) ?? getAdminSupabase();
  if (!supabase) return null;

  const [{ data: campaignRows, error: cErr }, { data: slotRows, error: sErr }] =
    await Promise.all([
      supabase.from("ad_campaigns").select("*").order("name"),
      supabase.from("ad_slots").select("*").order("sort_order"),
    ]);

  if (cErr || sErr) return null;
  if (!campaignRows?.length || !slotRows?.length) return null;

  const campaigns: Record<string, AdCampaign> = {};
  for (const row of campaignRows as AdCampaignRow[]) {
    campaigns[row.id] = campaignFromRow(row);
  }
  for (const [id, def] of Object.entries(DEFAULT_AD_CAMPAIGNS)) {
    if (!campaigns[id]) campaigns[id] = def;
  }

  const dbSlots: AdSlotDefinition[] = (slotRows as AdSlotRow[])
    .filter((r) => r.enabled)
    .map((r) => ({
      id: r.id,
      label: r.label,
      format: r.format as AdFormat,
      campaignId: r.campaign_id ?? undefined,
      enabled: r.enabled,
      sortOrder: r.sort_order,
    }));

  for (const def of DEFAULT_AD_SLOTS) {
    if (!dbSlots.some((s) => s.id === def.id)) {
      dbSlots.push(def);
    }
  }
  const slots = dbSlots.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return { campaigns, slots, source: "database" };
}

const fetchAdsConfigCached = unstable_cache(
  fetchFromDatabaseUncached,
  ["ads-config-v1"],
  { revalidate: 600, tags: [ADS_CONFIG_CACHE_TAG] },
);

export const getAdsConfig = cache(async (): Promise<AdsConfig> => {
  const fromDb = await fetchAdsConfigCached();
  if (fromDb) return fromDb;
  return {
    campaigns: DEFAULT_AD_CAMPAIGNS,
    slots: DEFAULT_AD_SLOTS.filter((s) => s.enabled !== false),
    source: "defaults",
  };
});

export async function resolveAdSlot(
  slotId: string,
): Promise<{ slot: AdSlotDefinition; campaign: AdCampaign } | null> {
  const { campaigns, slots } = await getAdsConfig();
  const slot = slots.find((s) => s.id === slotId);
  if (!slot || slot.enabled === false) return null;

  const pool = listActiveCampaigns(campaigns).filter((c) =>
    campaignCanUseSlot(c, slot),
  );
  const campaign = pickRotatingCampaign(slotId, pool);
  if (!campaign) return null;

  return { slot, campaign };
}

export async function getFooterSponsorStripItems(): Promise<AdSponsorStripItem[]> {
  const { campaigns, slots } = await getAdsConfig();
  return buildFooterSponsorStripItems(campaigns, slots);
}

/** @deprecated Préférer getFooterSponsorStripItems */
export async function getActiveSponsorCampaigns(): Promise<AdCampaign[]> {
  const items = await getFooterSponsorStripItems();
  return items.map((i) => i.campaign);
}

/** Admin — toutes les campagnes (y compris inactives). */
export async function listAdCampaignsAdmin(): Promise<AdCampaignRow[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("ad_campaigns").select("*").order("name");
  return (data ?? []) as AdCampaignRow[];
}

/** Admin — tous les slots. */
export async function listAdSlotsAdmin(): Promise<AdSlotRow[]> {
  const supabase = getAdminSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("ad_slots").select("*").order("sort_order");
  return (data ?? []) as AdSlotRow[];
}

export async function getAdCampaignAdmin(id: string): Promise<AdCampaignRow | null> {
  const supabase = getAdminSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("ad_campaigns").select("*").eq("id", id).maybeSingle();
  return (data as AdCampaignRow | null) ?? null;
}
