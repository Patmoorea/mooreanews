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
  const {
    GARDE_CACHE_SOURCE_ID,
    GARDE_CACHE_PAYLOAD_SOURCE_ID,
    readGardeMooreaFromCache,
  } = await import("../src/lib/garde-moorea-auto");
  const supabase = getAdminSupabase();
  if (supabase) {
    await supabase
      .from("external_articles")
      .delete()
      .eq("source_id", GARDE_CACHE_SOURCE_ID)
      .eq("external_id", "current");
    await supabase
      .from("external_articles")
      .delete()
      .eq("source_id", GARDE_CACHE_PAYLOAD_SOURCE_ID)
      .eq("external_id", "current");
    console.log("Cache garde Supabase purgé.");
  }

  console.log("=== Sync garde (tableau officiel) ===");
  const { syncGardeMooreaFromCommune } = await import("../src/lib/garde-moorea-auto");
  const result = await syncGardeMooreaFromCommune({ fullWeekendPipeline: true });
  console.log(JSON.stringify(result, null, 2));
  // Résultat lisible par le workflow (étape « Vérifier le résultat »).
  await writeFile(
    process.env.GARDE_RESULT_FILE || "/tmp/garde-sync-result.json",
    JSON.stringify(result),
    "utf8",
  ).catch(() => {});

  if (result.ok && result.found && result.doctor) {
    const snap = await readGardeMooreaFromCache();
    if (snap) {
      const filePayload = {
        validFrom: snap.validFrom,
        validTo: snap.validTo,
        label: snap.label,
        posterImageUrl: snap.posterImageUrl ?? undefined,
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

  // Code de sortie = vérité : ok:false (rien de publié / refusé) ⇒ échec.
  // Avant, un résultat ok:false avec un ancien médecin en cache sortait en 0 (« Sync CI OK »).
  if (!result.ok || !result.found || !result.doctor) {
    console.error(
      `\n✖ Garde NON publiée — cause: ${result.cause ?? "inconnue"}${result.ocrError ? ` — ${result.ocrError}` : ""}`,
    );
    process.exit(1);
  }
  console.log(`\n✔ Garde publiée : ${result.doctor} (${result.weekend})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
