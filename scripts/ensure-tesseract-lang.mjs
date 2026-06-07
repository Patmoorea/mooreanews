/**
 * Télécharge fra.traineddata.gz pour l'OCR garde (build Vercel, pas de CDN au runtime).
 */
import fs from "fs";
import path from "path";

const dir = path.join(process.cwd(), "data/ocr");
const dest = path.join(dir, "fra.traineddata.gz");
const url = "https://tessdata.projectnaptha.com/4.0.0/fra.traineddata.gz";

if (fs.existsSync(dest) && fs.statSync(dest).size > 1_000_000) {
  console.log("[ocr] fra.traineddata.gz déjà présent");
  process.exit(0);
}

fs.mkdirSync(dir, { recursive: true });
console.log("[ocr] Téléchargement fra.traineddata.gz…");

const res = await fetch(url);
if (!res.ok) {
  console.error("[ocr] Échec téléchargement:", res.status);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(dest, buf);
console.log("[ocr] OK —", Math.round(buf.length / 1024), "Ko");
