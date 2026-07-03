#!/usr/bin/env npx tsx
/**
 * Sync garde week-end immédiat (COPPF OCR + article Supabase).
 *   npx tsx scripts/run-garde-sync-now.ts
 */
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
    process.exit(1);
  }

  const { getAdminSupabase } = await import("../src/lib/supabase/admin");
  const { GARDE_CACHE_SOURCE_ID } = await import("../src/lib/garde-moorea-auto");
  const supabase = getAdminSupabase();
  if (supabase) {
    await supabase
      .from("external_articles")
      .delete()
      .eq("source_id", GARDE_CACHE_SOURCE_ID)
      .eq("external_id", "current");
    console.log("Cache garde Supabase purgé.");
  }

  const { syncGardeMooreaFromCommune } = await import("../src/lib/garde-moorea-auto");
  const { listCommuneMooreaGraphPosts } = await import("../src/lib/facebook-watch");

  console.log("=== Posts Commune (garde) ===");
  const posts = await listCommuneMooreaGraphPosts();
  for (const p of posts.slice(0, 10)) {
    const msg = (p.message ?? "").slice(0, 100).replace(/\n/g, " ");
    console.log(p.created_time, p.full_picture ? "IMG" : "---", msg);
  }

  console.log("\n=== Sync garde ===");
  const result = await syncGardeMooreaFromCommune({ fullWeekendPipeline: true });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
