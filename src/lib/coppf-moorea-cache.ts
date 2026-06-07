/**
 * Cache fichier du médecin Moorea extrait du planning COPPF (mis à jour par script / CI).
 */

import { readFile } from "fs/promises";
import path from "path";
import { isCoppfDocumentValidForDate } from "@/lib/coppf-ocr-parse";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

export type CoppfMooreaDoctorCache = {
  updatedAt: string;
  imageUrl: string;
  weekendLabel: string;
  validFrom: string;
  validTo: string;
  doctorName: string;
  phone: string;
  phoneHref: string;
};

let memory: CoppfMooreaDoctorCache | null | undefined;

async function readCacheFile(): Promise<CoppfMooreaDoctorCache | null> {
  try {
    const file = path.join(process.cwd(), "data/coppf-moorea-doctor.json");
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw) as CoppfMooreaDoctorCache;
    if (!data?.doctorName || !data?.validFrom || !data?.validTo) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getCachedCoppfMooreaDoctor(
  now = new Date(),
  sourcePageUrl?: string,
): Promise<OnCallDuty | null> {
  if (memory === undefined) {
    memory = await readCacheFile();
  }
  if (!memory) return null;

  if (
    !isCoppfDocumentValidForDate(
      { saturdayKey: memory.validFrom, sundayKey: memory.validTo },
      now,
    )
  ) {
    return null;
  }

  return {
    name: memory.doctorName,
    phone: memory.phone,
    phoneHref: memory.phoneHref,
    source: `Ordre des médecins PF — ${memory.weekendLabel}`,
    sourceUrl: sourcePageUrl ?? "https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/",
  };
}

export function clearCoppfMooreaDoctorMemoryCache(): void {
  memory = undefined;
}
