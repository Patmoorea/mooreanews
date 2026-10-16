#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { getAdminSupabase } = await import("../src/lib/supabase/admin");
  const { readGardeMooreaFromCache } = await import("../src/lib/garde-moorea-auto");
  const supabase = getAdminSupabase();
  if (!supabase) throw new Error("no supabase");

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, body, cover_url, updated_at")
    .eq("slug", "garde-moorea-2026-07-04")
    .maybeSingle();

  console.log("=== Article ===");
  console.log(JSON.stringify(article, null, 2));

  const snap = await readGardeMooreaFromCache();

  console.log("\n=== Cache garde (bannière) ===");
  console.log({
    doctor: snap?.doctor,
    pharmacyHours: snap?.pharmacyHours?.length,
    label: snap?.label,
    validFrom: snap?.validFrom,
    validTo: snap?.validTo,
  });
}

main().catch(console.error);
