#!/usr/bin/env npx tsx
/**
 * Sync garde week-end immédiat (COPPF OCR + article Supabase).
 *   npx tsx scripts/run-garde-sync-now.ts
 */
import { config } from "dotenv";
import { writeFile } from "fs/promises";
import path from "path";

config({ path: ".env.local" });

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
    process.exit(1);
  }

  const { getAdminSupabase } = await import("../src/lib/supabase/admin");
  const { GARDE_CACHE_SOURCE_ID, readGardeMooreaFromCache } = await import(
    "../src/lib/garde-moorea-auto"
  );
  const supabase = getAdminSupabase();
  if (supabase) {
    await supabase
      .from("external_articles")
      .delete()
      .eq("source_id", GARDE_CACHE_SOURCE_ID)
      .eq("external_id", "current");
    console.log("Cache garde Supabase purgé.");
  }

  const { listCommuneMooreaGraphPosts } = await import("../src/lib/facebook-watch");

  console.log("=== Posts Commune (garde) ===");
  const posts = await listCommuneMooreaGraphPosts();
  for (const p of posts.slice(0, 10)) {
    const msg = (p.message ?? "").slice(0, 100).replace(/\n/g, " ");
    console.log(p.created_time, p.full_picture ? "IMG" : "---", msg);
  }

  console.log("\n=== Sync garde ===");
  const { syncGardeMooreaFromCommune } = await import("../src/lib/garde-moorea-auto");
  const result = await syncGardeMooreaFromCommune({ fullWeekendPipeline: true });
  console.log(JSON.stringify(result, null, 2));

  if (result.found && result.doctor) {
    const snap = await readGardeMooreaFromCache();
    if (snap) {
      const filePayload = {
        validFrom: snap.validFrom,
        validTo: snap.validTo,
        label: snap.label,
        posterImageUrl: snap.posterImageUrl ?? snap.communePosterUrl,
        doctor: snap.doctor
          ? {
              name: snap.doctor.name.replace(/^Dr\.?\s+/i, ""),
              phone: snap.doctor.phone,
              hours: snap.doctorHours,
            }
          : undefined,
        pharmacyHours: snap.pharmacyHours,
      };
      const dest = path.join(process.cwd(), "data/garde-moorea.json");
      await writeFile(dest, `${JSON.stringify(filePayload, null, 2)}\n`, "utf8");
      console.log(`\nFichier secours mis à jour : ${dest}`);
    }
  }

  if (!result.found || !result.doctor) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
