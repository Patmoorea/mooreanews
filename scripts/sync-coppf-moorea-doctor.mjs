#!/usr/bin/env node
/**
 * Met à jour data/coppf-moorea-doctor.json depuis le planning COPPF (OCR local).
 * Usage : node scripts/sync-coppf-moorea-doctor.mjs
 */

import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const { fetchCoppfDoctorSchedule } = await import("../src/lib/coppf-guard-schedule.ts");
const { fetchMooreaDoctorFromCoppfOcrDirect } = await import(
  "../src/lib/coppf-moorea-guard.ts"
);
const { parseMooreaDoctorFromCoppfOcr } = await import("../src/lib/coppf-ocr-parse.ts");

const schedule = await fetchCoppfDoctorSchedule();
const imageUrl = schedule?.images[0]?.imageUrl;
if (!imageUrl) {
  console.error("Aucune image COPPF trouvée.");
  process.exit(1);
}

const now = new Date();
const duty = await fetchMooreaDoctorFromCoppfOcrDirect(
  imageUrl,
  now,
  schedule.pageUrl,
);

if (!duty) {
  console.error("OCR : aucun médecin Moorea pour la date actuelle (document expiré ?).");
  process.exit(1);
}

const ocrText = await (async () => {
  const res = await fetch(imageUrl);
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra");
  try {
    const { data } = await worker.recognize(Buffer.from(await res.arrayBuffer()));
    return data.text;
  } finally {
    await worker.terminate();
  }
})();

const parsed = parseMooreaDoctorFromCoppfOcr(ocrText, now);
if (!parsed) {
  console.error("Parse dates week-end impossible.");
  process.exit(1);
}

const payload = {
  updatedAt: schedule.updatedAt ?? now.toISOString(),
  imageUrl,
  weekendLabel: parsed.weekendLabel,
  validFrom: parsed.validFrom,
  validTo: parsed.validTo,
  doctorName: duty.name,
  phone: duty.phone,
  phoneHref: duty.phoneHref,
};

const out = path.join(root, "data/coppf-moorea-doctor.json");
await writeFile(out, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log("OK →", out);
console.log(payload.doctorName, payload.phone, `(${parsed.validFrom} → ${parsed.validTo})`);
