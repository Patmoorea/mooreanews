/**
 * Garde week-end Moorea — auto (Facebook commune) + secours data/garde-moorea.json.
 */

import { readFile } from "fs/promises";
import path from "path";
import { resolveGardeMooreaAuto, readGardeMooreaFromCache, type GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { gardeArticleSlug } from "@/lib/garde-weekend-article";
import { tahitiDateKey, tahitiParts } from "@/lib/tahiti-holidays";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

export type GardeMooreaFile = {
  validFrom: string;
  validTo: string;
  label?: string;
  posterImageUrl?: string;
  pharmacy?: { name?: string; phone?: string; address?: string };
  doctor?: {
    name?: string;
    phone?: string;
    address?: string;
    hours?: { saturday?: string; sunday?: string };
  };
  pharmacyHours?: Array<{
    district: string;
    phone: string;
    saturday?: string;
    sunday?: string;
  }>;
};

function addDaysKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  return dt.toISOString().slice(0, 10);
}

/** Vrai si le fichier concerne le WE en cours ou le WE suivant (vendredi). */
export function isGardeWeekActive(
  now: Date,
  validFrom: string,
  validTo: string,
): boolean {
  const today = tahitiDateKey(now);
  if (today >= validFrom && today <= validTo) return true;

  const { dow } = tahitiParts(now);
  if (dow === 5 && today < validFrom && addDaysKey(today, 1) === validFrom) {
    return true;
  }

  return false;
}

function phoneHref(phone: string): string {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("689") && d.length >= 11) d = d.slice(3);
  if (d.length < 8) return "";
  d = d.slice(-8);
  return `tel:+689${d}`;
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-8);
  if (d.length < 8) return phone.trim();
  return `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
}

function fileToDuty(
  kind: "pharmacy" | "doctor",
  entry: GardeMooreaFile["pharmacy"] | GardeMooreaFile["doctor"],
  label: string,
): OnCallDuty | null {
  const name = entry?.name?.trim();
  if (!name) return null;
  const phoneRaw = entry?.phone?.trim() ?? "";
  const phone = phoneRaw ? formatPhone(phoneRaw) : "—";
  const href = phoneRaw ? phoneHref(phoneRaw) : "";

  if (kind === "doctor") {
    return {
      name: name.startsWith("Dr") ? name : `Dr ${name}`,
      phone,
      phoneHref: href,
      address: (entry as GardeMooreaFile["doctor"])?.address?.trim(),
      source: `Garde week-end — ${label}`,
    };
  }
  return {
    name,
    phone,
    phoneHref: href,
    address: (entry as GardeMooreaFile["pharmacy"])?.address?.trim(),
    source: `Garde week-end — ${label}`,
  };
}

let fileMemory: GardeMooreaFile | null | undefined;

async function readGardeFileRaw(): Promise<GardeMooreaFile | null> {
  if (fileMemory !== undefined) return fileMemory;
  try {
    const raw = await readFile(path.join(process.cwd(), "data/garde-moorea.json"), "utf8");
    const data = JSON.parse(raw) as GardeMooreaFile;
    if (!data?.validFrom || !data?.validTo) {
      fileMemory = null;
      return null;
    }
    fileMemory = data;
    return data;
  } catch {
    fileMemory = null;
    return null;
  }
}

export function fileToSnapshot(file: GardeMooreaFile): GardeMooreaSnapshot {
  const label = file.label?.trim() || `${file.validFrom} → ${file.validTo}`;
  const doctorEntry = file.doctor?.name?.trim()
    ? {
        name: file.doctor.name.startsWith("Dr")
          ? file.doctor.name
          : `Dr ${file.doctor.name}`,
        phone: file.doctor.phone?.trim()
          ? formatPhone(file.doctor.phone)
          : "—",
        phoneHref: file.doctor.phone?.trim()
          ? phoneHref(file.doctor.phone)
          : "",
      }
    : null;

  const pharmacyEntry = file.pharmacy?.name?.trim()
    ? {
        name: file.pharmacy.name,
        phone: file.pharmacy.phone?.trim()
          ? formatPhone(file.pharmacy.phone)
          : "—",
        phoneHref: file.pharmacy.phone?.trim()
          ? phoneHref(file.pharmacy.phone)
          : "",
      }
    : null;

  return {
    validFrom: file.validFrom,
    validTo: file.validTo,
    label,
    doctor: doctorEntry,
    pharmacy: pharmacyEntry,
    posterImageUrl: file.posterImageUrl ?? null,
    communePosterUrl: file.posterImageUrl ?? null,
    doctorAddress: file.doctor?.address?.trim(),
    doctorHours: file.doctor?.hours,
    pharmacyHours: file.pharmacyHours,
    articleSlug: gardeArticleSlug(file.validFrom),
    syncedAt: new Date().toISOString(),
    sourceUrl: "https://www.facebook.com/CommuneMooreaMaiao",
  };
}

export async function readGardeFileSnapshot(): Promise<GardeMooreaSnapshot | null> {
  const file = await readGardeFileRaw();
  if (!file) return null;
  return fileToSnapshot(file);
}

/** Snapshot pour affiche dynamique /api/garde-weekend/poster/[validFrom] */
export async function resolveGardeSnapshotForPoster(
  validFrom: string,
): Promise<GardeMooreaSnapshot | null> {
  const cached = await readGardeMooreaFromCache();
  if (cached?.validFrom === validFrom) return cached;

  const file = await readGardeFileSnapshot();
  if (file?.validFrom === validFrom) return file;

  return null;
}

export function clearGardeMooreaMemoryCache(): void {
  fileMemory = undefined;
}

async function fromFile(now: Date): Promise<{
  pharmacy: OnCallDuty | null;
  doctor: OnCallDuty | null;
  weekendLabel: string | null;
}> {
  const file = await readGardeFileRaw();
  if (!file || !isGardeWeekActive(now, file.validFrom, file.validTo)) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }
  const label = file.label?.trim() || `${file.validFrom} → ${file.validTo}`;
  return {
    weekendLabel: label,
    pharmacy: fileToDuty("pharmacy", file.pharmacy, label),
    doctor: fileToDuty("doctor", file.doctor, label),
  };
}

export async function getGardeMooreaForNow(now = new Date()): Promise<{
  pharmacy: OnCallDuty | null;
  doctor: OnCallDuty | null;
  weekendLabel: string | null;
}> {
  const auto = await resolveGardeMooreaAuto(now);
  if (auto.pharmacy || auto.doctor) return auto;

  return fromFile(now);
}
