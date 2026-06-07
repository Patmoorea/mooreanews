/**
 * OCR du planning COPPF (Ordre des médecins PF) — ligne Moorea du week-end en cours.
 * Tesseract ne tourne pas de façon fiable sur Vercel : OCR réservé aux scripts locaux / CI.
 */

import { unstable_cache } from "next/cache";
import { parseMooreaDoctorFromCoppfOcr } from "@/lib/coppf-ocr-parse";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

const FETCH_HEADERS = {
  Accept: "image/*",
  "User-Agent": "MooreaNews/1.0 (+https://www.mooreanews.com; COPPF OCR)",
};

const OCR_CACHE_MS = 24 * 60 * 60 * 1000;
const OCR_TIMEOUT_MS = 12_000;

/** Tesseract bloque les fonctions Vercel (timeout ~60 s) — OCR hors prod serverless. */
export function isLiveCoppfOcrEnabled(): boolean {
  if (process.env.DISABLE_COPPF_OCR === "1") return false;
  if (process.env.ENABLE_COPPF_OCR === "1") return true;
  return process.env.VERCEL !== "1";
}

const ocrTextMemory = new Map<string, { at: number; text: string | null }>();

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("OCR timeout")), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

async function runOcrOnImage(buffer: Buffer): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra");
  try {
    const { data } = await worker.recognize(buffer);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

async function fetchAndOcrCoppfImage(imageUrl: string): Promise<string | null> {
  const res = await fetch(imageUrl, { headers: FETCH_HEADERS, cache: "no-store" });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return withTimeout(runOcrOnImage(buffer), OCR_TIMEOUT_MS);
}

async function loadOcrText(imageUrl: string): Promise<string | null> {
  const mem = ocrTextMemory.get(imageUrl);
  if (mem && Date.now() - mem.at < OCR_CACHE_MS) return mem.text;

  try {
    const text = await fetchAndOcrCoppfImage(imageUrl);
    ocrTextMemory.set(imageUrl, { at: Date.now(), text });
    return text;
  } catch {
    ocrTextMemory.set(imageUrl, { at: Date.now(), text: null });
    return null;
  }
}

async function getCoppfOcrText(imageUrl: string): Promise<string | null> {
  if (!isLiveCoppfOcrEnabled()) return null;

  try {
    return await unstable_cache(
      () => loadOcrText(imageUrl),
      ["coppf-ocr-text", imageUrl],
      { revalidate: 86400, tags: ["coppf-guard"] },
    )();
  } catch {
    return loadOcrText(imageUrl);
  }
}

export async function fetchMooreaDoctorFromCoppfOcr(
  imageUrl: string,
  now = new Date(),
  sourcePageUrl?: string,
): Promise<OnCallDuty | null> {
  if (!isLiveCoppfOcrEnabled()) return null;

  const ocrText = await getCoppfOcrText(imageUrl);
  if (!ocrText) return null;

  const parsed = parseMooreaDoctorFromCoppfOcr(ocrText, now);
  if (!parsed) return null;

  return {
    name: parsed.doctorName,
    phone: parsed.phone,
    phoneHref: parsed.phoneHref,
    source: `Ordre des médecins PF — ${parsed.weekendLabel}`,
    sourceUrl: sourcePageUrl ?? "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/",
  };
}

export function clearCoppfOcrCache(): void {
  ocrTextMemory.clear();
}

export function parseMooreaDoctorFromCoppfOcrText(
  ocrText: string,
  now = new Date(),
  sourcePageUrl?: string,
): OnCallDuty | null {
  const parsed = parseMooreaDoctorFromCoppfOcr(ocrText, now);
  if (!parsed) return null;
  return {
    name: parsed.doctorName,
    phone: parsed.phone,
    phoneHref: parsed.phoneHref,
    source: `Ordre des médecins PF — ${parsed.weekendLabel}`,
    sourceUrl: sourcePageUrl ?? "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/",
  };
}

/** OCR direct (scripts locaux / CI). */
export async function fetchMooreaDoctorFromCoppfOcrDirect(
  imageUrl: string,
  now = new Date(),
  sourcePageUrl?: string,
): Promise<OnCallDuty | null> {
  const ocrText = await loadOcrText(imageUrl);
  if (!ocrText) return null;
  return parseMooreaDoctorFromCoppfOcrText(ocrText, now, sourcePageUrl);
}
