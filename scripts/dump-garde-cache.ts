#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { readGardeMooreaFromCache } = await import("../src/lib/garde-moorea-auto");
  const { getGardeMooreaForNow } = await import("../src/lib/garde-moorea-data");
  const snap = await readGardeMooreaFromCache();
  console.log(JSON.stringify(snap, null, 2));
  const now = new Date("2026-07-09T18:00:00-10:00");
  const duties = await getGardeMooreaForNow(now);
  console.log("\n--- duties ---\n", JSON.stringify(duties, null, 2));
}

main();
