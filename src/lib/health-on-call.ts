/**
 * Garde week-end Moorea — pharmacie + médecin depuis data/garde-moorea.json.
 */

import { cache } from "react";
import {
  clearGardeMooreaMemoryCache,
  getGardeMooreaForNow,
} from "@/lib/garde-moorea-data";
import {
  formatTahitiDay,
  isHealthOnCallPeriod,
  tahitiHolidayLabel,
  tahitiParts,
} from "@/lib/tahiti-holidays";
import type { HealthOnCallData } from "@/lib/health-on-call-shared";

export type {
  HealthOnCallData,
  OnCallDuty,
} from "@/lib/health-on-call-shared";

const COMMUNE_FB = "https://www.facebook.com/CommuneMooreaMaiao";

const DSP_GARDE_PHONES = [
  { label: "Direction de la santé", phone: "40 47 01 44", phoneHref: "tel:+68940470144" },
  { label: "Direction de la santé", phone: "40 47 01 47", phoneHref: "tel:+68940470147" },
] as const;

const CACHE_MS = 6 * 60 * 60 * 1000;
let dataCache: { at: number; data: HealthOnCallData } | null = null;

function buildPeriodLabel(d: Date, weekendLabel: string | null): string {
  const holiday = tahitiHolidayLabel(d);
  if (weekendLabel) return weekendLabel;
  if (holiday) return `${formatTahitiDay(d)} — ${holiday}`;
  const { dow } = tahitiParts(d);
  if (dow === 5) return `Ce week-end (${formatTahitiDay(d)})`;
  return formatTahitiDay(d);
}

export async function getHealthOnCallUncached(now = new Date()): Promise<HealthOnCallData> {
  if (dataCache && Date.now() - dataCache.at < CACHE_MS) return dataCache.data;

  const garde = await getGardeMooreaForNow(now);

  const data: HealthOnCallData = {
    generatedAt: now.toISOString(),
    periodLabel: buildPeriodLabel(now, garde.weekendLabel),
    showProminent: isHealthOnCallPeriod(now),
    holidayLabel: tahitiHolidayLabel(now),
    weekendLabel: garde.weekendLabel,
    onDutyPharmacy: garde.pharmacy,
    onDutyDoctor: garde.doctor,
    dspContacts: [...DSP_GARDE_PHONES],
    sources: [
      { label: "DSP garde — 40 47 01 44", href: "tel:+68940470144" },
      { label: "Commune Moorea-Maiao", href: COMMUNE_FB },
    ],
  };

  dataCache = { at: Date.now(), data };
  return data;
}

/** Une seule résolution par requête React (accueil appelle plusieurs composants). */
export const getHealthOnCall = cache(getHealthOnCallUncached);

export function clearHealthOnCallCache(): void {
  dataCache = null;
  clearGardeMooreaMemoryCache();
}

export async function syncHealthOnCall(): Promise<{
  ok: boolean;
  pharmacy: string | null;
  doctor: string | null;
}> {
  clearHealthOnCallCache();
  const data = await getHealthOnCall();
  return {
    ok: true,
    pharmacy: data.onDutyPharmacy?.name ?? null,
    doctor: data.onDutyDoctor?.name ?? null,
  };
}
