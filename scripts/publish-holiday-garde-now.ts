#!/usr/bin/env npx tsx
/**
 * Publie immédiatement la garde du jour férié en cache Supabase + revalide prod.
 */
import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";

config({ path: ".env.local" });

async function main() {
  const { writeGardeMooreaCache } = await import("../src/lib/garde-moorea-auto");
  const { fileToSnapshot } = await import("../src/lib/garde-moorea-data");

  const file = JSON.parse(readFileSync("./data/garde-moorea.json", "utf8"));
  const snap = fileToSnapshot(file);
  snap.sourceUrl = "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/";
  snap.communePosterUrl = file.posterImageUrl;
  snap.syncedAt = new Date().toISOString();

  const ok = await writeGardeMooreaCache(snap);
  console.log("cache write", ok, snap.validFrom, snap.doctor?.name);

  let secret = process.env.CRON_SECRET?.trim();
  if (!secret && existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      if (line.startsWith("CRON_SECRET=")) secret = line.slice("CRON_SECRET=".length).trim();
    }
  }
  if (!secret) {
    console.error("CRON_SECRET manquant");
    process.exit(1);
  }

  const url = `https://www.mooreanews.com/api/cron/garde-weekend?secret=${encodeURIComponent(secret)}&force=1&wait=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  const body = await res.text();
  console.log("HTTP", res.status);
  console.log(body.slice(0, 1500));

  const check = await fetch("https://www.mooreanews.com/api/health-on-call", {
    cache: "no-store",
  });
  console.log("health-on-call", await check.text());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
