#!/usr/bin/env npx tsx
/** Rend l'image garde MooreaNews à partir d'un texte OCR du tableau officiel. Usage : tsx scripts/render-garde-image.ts <ocr.txt> <out.png> */
import { readFileSync, writeFileSync } from "node:fs";
import { mergeGardeOcrIntoSnapshot, defaultMooreaPharmacyHours } from "../src/lib/garde-announcement-parse";
import { renderGardeWeekendPosterPng } from "../src/lib/garde-weekend-poster";
import type { GardeMooreaSnapshot } from "../src/lib/garde-moorea-auto";

async function main() {
  const [inFile, out] = process.argv.slice(2);
  const base: GardeMooreaSnapshot = {
    validFrom: "", validTo: "", label: "", doctor: null, pharmacy: null,
    pharmacyHours: defaultMooreaPharmacyHours(), syncedAt: new Date().toISOString(),
  };
  const snap = mergeGardeOcrIntoSnapshot(base, readFileSync(inFile!, "utf8"));
  console.log(snap.label, snap.doctor, snap.doctorHours);
  writeFileSync(out!, await renderGardeWeekendPosterPng(snap));
}
main();
