#!/usr/bin/env npx tsx
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const url =
    "https://www.ordre-pharmaciens-polynesie.com/wp-content/uploads/2026/06/Screenshot_20260611-222703_Drive.jpg";
  const { ocrGardePosterImage } = await import("../src/lib/garde-poster-ocr");
  const r = await ocrGardePosterImage(url);
  console.log(JSON.stringify({ ok: r.ok, error: r.error, len: r.text?.length }, null, 2));
  console.log("---");
  console.log(r.text);
}

main().catch(console.error);
