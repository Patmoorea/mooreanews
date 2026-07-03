#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { getAdminSupabase } = await import("../src/lib/supabase/admin");
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error("no supabase");

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, body, cover_url, updated_at")
    .eq("slug", "garde-moorea-2026-07-04")
    .maybeSingle();

  console.log("=== Article ===");
  console.log(JSON.stringify(article, null, 2));

  const { data: cache } = await supabase
    .from("external_articles")
    .select("title, excerpt, fetched_at")
    .eq("source_id", "moorea-garde-weekend")
    .eq("external_id", "current")
    .maybeSingle();

  console.log("\n=== Cache excerpt (doctor) ===");
  if (cache?.excerpt) {
    const snap = JSON.parse(cache.excerpt);
    console.log({
      doctor: snap.doctor,
      pharmacyHours: snap.pharmacyHours?.length,
      label: snap.label,
    });
  }
}

main().catch(console.error);
