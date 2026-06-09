import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_AD_CAMPAIGNS, DEFAULT_AD_SLOTS } from "@/lib/ads-defaults";
import type { AdFormat } from "@/lib/ads-types";

/** Initialise les tables pub depuis les valeurs par défaut (admin / cron). */
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin missing" }, { status: 503 });
  }

  for (const c of Object.values(DEFAULT_AD_CAMPAIGNS)) {
    const { error } = await supabase.from("ad_campaigns").upsert({
      id: c.id,
      name: c.name,
      image: c.image,
      image_width: c.imageWidth,
      image_height: c.imageHeight,
      href: c.href,
      alt: c.alt,
      sponsor: c.sponsor ?? null,
      active: c.active,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  for (const s of DEFAULT_AD_SLOTS) {
    const { error } = await supabase.from("ad_slots").upsert({
      id: s.id,
      label: s.label,
      format: s.format as AdFormat,
      campaign_id: s.campaignId,
      enabled: s.enabled !== false,
      sort_order: s.sortOrder ?? 0,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, campaigns: Object.keys(DEFAULT_AD_CAMPAIGNS).length, slots: DEFAULT_AD_SLOTS.length });
}
