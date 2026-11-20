#!/usr/bin/env npx tsx
/**
 * Sync garde week-end immédiat (COPPF OCR + article Supabase).
 *   npx tsx scripts/run-garde-sync-now.ts
 */
import { config } from "dotenv";
import { writeFile } from "fs/promises";
import path from "path";

config({ path: ".env.local" });

type ProtectedArticle = {
  title: string;
  excerpt: string | null;
  body: string | null;
  cover_url: string | null;
};

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
    process.exit(1);
  }

  // Après dotenv : ces modules lisent les clés Supabase au chargement.
  const { getAdminSupabase } = await import("../src/lib/supabase/admin");
  const { readGardeMooreaFromCache, writeGardeMooreaCache } = await import(
    "../src/lib/garde-moorea-auto"
  );
  const { gardePublishMismatch } = await import("../src/lib/garde-sync-verdict");
  const supabase = getAdminSupabase();
  const protectSlug = process.env.GARDE_PROTECT_SLUG?.trim() || "";
  const previousCache = await readGardeMooreaFromCache();
  let protectedBefore: ProtectedArticle | null = null;
  if (supabase && protectSlug) {
    const { data } = await supabase
      .from("articles")
      .select("title, excerpt, body, cover_url")
      .eq("slug", protectSlug)
      .maybeSingle();
    protectedBefore = data;
  }
  // Pas de purge du cache avant l'OCR : un échec laisse le médecin déjà en ligne.
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

  const snap = result.ok ? await readGardeMooreaFromCache() : null;
  const mismatch = gardePublishMismatch(snap, {
    doctor: process.env.GARDE_EXPECT_DOCTOR,
    phone: process.env.GARDE_EXPECT_PHONE,
    validFrom: process.env.GARDE_EXPECT_FROM,
    validTo: process.env.GARDE_EXPECT_TO || process.env.GARDE_EXPECT_FROM,
  });
  let protectedChanged = false;
  if (supabase && protectSlug) {
    const { data: after } = await supabase
      .from("articles")
      .select("title, excerpt, body, cover_url")
      .eq("slug", protectSlug)
      .maybeSingle();
    protectedChanged = JSON.stringify(after) !== JSON.stringify(protectedBefore);
    if (protectedChanged) {
      if (protectedBefore) {
        const restored = {
          title: protectedBefore.title,
          ...(protectedBefore.excerpt != null ? { excerpt: protectedBefore.excerpt } : {}),
          ...(protectedBefore.body != null ? { body: protectedBefore.body } : {}),
          ...(protectedBefore.cover_url != null ? { cover_url: protectedBefore.cover_url } : {}),
        };
        await supabase.from("articles").update(restored).eq("slug", protectSlug);
      } else {
        await supabase.from("articles").delete().eq("slug", protectSlug);
      }
      console.error(`Article protégé restauré : ${protectSlug}`);
    }
  }
  if (mismatch) {
    console.error(`\n✖ Publication refusée — ${mismatch}`);
    if (previousCache) {
      await writeGardeMooreaCache(previousCache);
      console.error("Cache précédent restauré.");
    }
    const badFrom = process.env.GARDE_EXPECT_FROM?.trim();
    if (supabase && badFrom && `garde-moorea-${badFrom}` !== protectSlug) {
      await supabase.from("articles").delete().eq("slug", `garde-moorea-${badFrom}`);
      console.error(`Article garde-moorea-${badFrom} retiré.`);
    }
    process.exit(1);
  }

  if (result.ok && result.found && result.doctor && snap) {
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
