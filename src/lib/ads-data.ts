import { cache } from "react";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  DEFAULT_AD_CAMPAIGNS,
  DEFAULT_AD_SLOTS,
} from "@/lib/ads-defaults";
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
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    href: row.href,
    alt: row.alt,
    sponsor: row.sponsor ?? undefined,
    active: row.active,
  };
}

function slotFromRow(row: AdSlotRow): AdSlotDefinition | null {
  if (!row.campaign_id || !row.enabled) return null;
  return {
    id: row.id,
    label: row.label,
    format: row.format,
    campaignId: row.campaign_id,
    enabled: row.enabled,
    sortOrder: row.sort_order,
  };
}

async function fetchFromDatabase(): Promise<AdsConfig | null> {
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

  const slots = (slotRows as AdSlotRow[])
    .filter((r) => r.enabled && r.campaign_id)
    .map((r) => ({
      id: r.id,
      label: r.label,
      format: r.format as AdFormat,
      campaignId: r.campaign_id!,
      enabled: r.enabled,
      sortOrder: r.sort_order,
    }));

  return { campaigns, slots, source: "database" };
}

export const getAdsConfig = cache(async (): Promise<AdsConfig> => {
  const fromDb = await fetchFromDatabase();
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
  if (!slot) return null;
  const campaign = campaigns[slot.campaignId];
  if (!campaign?.active) return null;
  return { slot, campaign };
}

export async function getActiveSponsorCampaigns(): Promise<AdCampaign[]> {
  const { campaigns, slots } = await getAdsConfig();
  const seen = new Set<string>();
  const out: AdCampaign[] = [];
  for (const slot of slots) {
    if (slot.format !== "ribbon") continue;
    const c = campaigns[slot.campaignId];
    if (c?.active && !seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
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
