#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { fetchGardeFromImportedArticles } = await import("../src/lib/garde-site-articles");
  const snap = await fetchGardeFromImportedArticles();
  console.log(JSON.stringify(snap, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
