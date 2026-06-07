/**
 * Garde week-end Moorea — fichier data/garde-moorea.json (édité chaque vendredi).
 * Affiché uniquement pour le week-end en cours ou le week-end suivant (vendredi).
 */

import { readFile } from "fs/promises";
import path from "path";
import { tahitiDateKey, tahitiParts } from "@/lib/tahiti-holidays";
import type { OnCallDuty } from "@/lib/health-on-call-shared";

export type GardeMooreaFile = {
  validFrom: string;
  validTo: string;
  label?: string;
  pharmacy?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  doctor?: {
    name?: string;
    phone?: string;
  };
};

const SOURCE = "Garde week-end Moorea";

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

function toDuty(
  kind: "pharmacy" | "doctor",
  entry: { name?: string; phone?: string; address?: string } | undefined,
  weekendLabel: string,
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
      source: `${SOURCE} — ${weekendLabel}`,
    };
  }

  return {
    name,
    phone,
    phoneHref: href,
    address: entry?.address?.trim() || undefined,
    source: `${SOURCE} — ${weekendLabel}`,
  };
}

let memory: GardeMooreaFile | null | undefined;

async function readGardeFile(): Promise<GardeMooreaFile | null> {
  if (memory !== undefined) return memory;
  try {
    const file = path.join(process.cwd(), "data/garde-moorea.json");
    const raw = await readFile(file, "utf8");
    const data = JSON.parse(raw) as GardeMooreaFile;
    if (!data?.validFrom || !data?.validTo) {
      memory = null;
      return null;
    }
    memory = data;
    return data;
  } catch {
    memory = null;
    return null;
  }
}

export function clearGardeMooreaMemoryCache(): void {
  memory = undefined;
}

export async function getGardeMooreaForNow(now = new Date()): Promise<{
  pharmacy: OnCallDuty | null;
  doctor: OnCallDuty | null;
  weekendLabel: string | null;
}> {
  const file = await readGardeFile();
  if (!file || !isGardeWeekActive(now, file.validFrom, file.validTo)) {
    return { pharmacy: null, doctor: null, weekendLabel: null };
  }

  const weekendLabel = file.label?.trim() || `${file.validFrom} → ${file.validTo}`;

  return {
    pharmacy: toDuty("pharmacy", file.pharmacy, weekendLabel),
    doctor: toDuty("doctor", file.doctor, weekendLabel),
    weekendLabel,
  };
}
