"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { AdFormat } from "@/lib/ads-types";
import {
  AD_FORMATS,
  formatImagesToJson,
  pickPrimaryCampaignImage,
  campaignFormatImagesFromDefaults,
} from "@/lib/ads-format-images";

function slugifyId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function revalidateAds() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/ads");
  revalidatePath("/partenaires");
}

function parseFormatImagesFromForm(formData: FormData): Partial<Record<AdFormat, string>> {
  const images: Partial<Record<AdFormat, string>> = {};
  for (const format of AD_FORMATS) {
    const value = String(formData.get(`format_image_${format}`) ?? "").trim();
    if (value) images[format] = value;
  }
  if (images.rectangle && !images.sidebar) {
    images.sidebar = images.rectangle;
  }
  return images;
}

export async function saveAdCampaign(formData: FormData) {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error("Supabase admin non configuré");

  const existingId = String(formData.get("id") ?? "").trim();
  const id = existingId || slugifyId(String(formData.get("new_id") ?? ""));
  if (!id) throw new Error("Identifiant requis");

  const formatImages = parseFormatImagesFromForm(formData);
  const image = pickPrimaryCampaignImage(formatImages);
  if (!image) {
    throw new Error("Au moins une bannière (par format) est obligatoire");
  }

  const payload = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    image,
    image_width: 728,
    image_height: 90,
    format_images: formatImagesToJson(formatImages),
    href: String(formData.get("href") ?? "").trim(),
    alt: String(formData.get("alt") ?? "").trim(),
    sponsor: String(formData.get("sponsor") ?? "").trim() || null,
    active: formData.get("active") === "on",
  };

  if (!payload.name || !payload.href) {
    throw new Error("Nom et lien obligatoires");
  }

  const { error } = await supabase.from("ad_campaigns").upsert(payload);
  if (error) throw new Error(error.message);

  revalidateAds();
  redirect(`/admin/ads/campaigns/${id}?saved=1`);
}

export async function deleteAdCampaign(formData: FormData) {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error("Supabase admin non configuré");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await supabase.from("ad_slots").update({ campaign_id: null }).eq("campaign_id", id);
  const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAds();
  redirect("/admin/ads");
}

export async function updateAdSlot(formData: FormData) {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error("Supabase admin non configuré");

  const slotId = String(formData.get("slot_id") ?? "").trim();
  const campaignId = String(formData.get("campaign_id") ?? "").trim() || null;
  const enabled = formData.get("enabled") === "on";

  const { error } = await supabase
    .from("ad_slots")
    .update({ campaign_id: campaignId, enabled })
    .eq("id", slotId);

  if (error) throw new Error(error.message);
  revalidateAds();
}

export async function seedAdDefaults() {
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error("Supabase admin non configuré");

  const { DEFAULT_AD_CAMPAIGNS, DEFAULT_AD_SLOTS } = await import("@/lib/ads-defaults");
  for (const c of Object.values(DEFAULT_AD_CAMPAIGNS)) {
    const { error } = await supabase.from("ad_campaigns").upsert({
      id: c.id,
      name: c.name,
      image: c.image,
      image_width: c.imageWidth,
      image_height: c.imageHeight,
      format_images: campaignFormatImagesFromDefaults(c),
      href: c.href,
      alt: c.alt,
      sponsor: c.sponsor ?? null,
      active: c.active,
    });
    if (error) throw new Error(error.message);
  }
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
  }

  await supabase.from("ad_slots").delete().eq("id", "footer-sponsors");

  revalidateAds();
  redirect("/admin/ads?seeded=1");
}
