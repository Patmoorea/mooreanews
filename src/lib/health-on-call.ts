/**
 * Garde week-end Moorea — pharmacie + médecin (veille auto commune Facebook).
 */

import { cache } from "react";
import {
  clearGardeMooreaMemoryCache,
  getGardeMooreaForNow,
} from "@/lib/garde-moorea-data";
import { syncGardeMooreaFromCommune, type GardeSyncOptions } from "@/lib/garde-moorea-auto";
import { getGardeWeekendHighlight } from "@/lib/garde-weekend-public";
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

function buildEmptyHealthData(now: Date): HealthOnCallData {
  return {
    generatedAt: now.toISOString(),
    periodLabel: buildPeriodLabel(now, null),
    showProminent: isHealthOnCallPeriod(now),
    holidayLabel: tahitiHolidayLabel(now),
    weekendLabel: null,
    onDutyPharmacy: null,
    onDutyDoctor: null,
    dspContacts: [...DSP_GARDE_PHONES],
    sources: [
      { label: "DSP garde — 40 47 01 44", href: "tel:+68940470144" },
      { label: "Commune Moorea-Maiao", href: COMMUNE_FB },
    ],
  };
}

export async function getHealthOnCallUncached(now = new Date()): Promise<HealthOnCallData> {
  if (dataCache && Date.now() - dataCache.at < CACHE_MS) return dataCache.data;

  try {
    const garde = await getGardeMooreaForNow(now);
    const highlight = await getGardeWeekendHighlight(now);

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
      posterImageUrl: garde.posterImageUrl ?? null,
      articleHref: highlight?.href ?? null,
    };

    dataCache = { at: Date.now(), data };
    return data;
  } catch {
    const data = buildEmptyHealthData(now);
    dataCache = { at: Date.now(), data };
    return data;
  }
}

export const getHealthOnCall = cache(getHealthOnCallUncached);

export function clearHealthOnCallCache(): void {
  dataCache = null;
  clearGardeMooreaMemoryCache();
}

export async function syncHealthOnCall(
  options: GardeSyncOptions = {},
): Promise<{
  ok: boolean;
  pharmacy: string | null;
  doctor: string | null;
  found: boolean;
  articleSlug: string | null;
  ocrUsed: boolean;
  posterGenerated: boolean;
  ocrError?: string;
  articleCreated?: boolean;
  articleUpdated?: boolean;
  articleError?: string;
  posterUrl?: string | null;
}> {
  clearHealthOnCallCache();
  const synced = await syncGardeMooreaFromCommune(options);
  const data = await getHealthOnCall();
  return {
    ok: synced.ok,
    found: synced.found,
    pharmacy: data.onDutyPharmacy?.name ?? null,
    doctor: data.onDutyDoctor?.name ?? null,
    articleSlug: synced.articleSlug,
    ocrUsed: synced.ocrUsed,
    posterGenerated: synced.posterGenerated,
    ocrError: synced.ocrError,
    articleCreated: synced.articleCreated,
    articleUpdated: synced.articleUpdated,
    articleError: synced.articleError,
    posterUrl: synced.posterUrl,
  };
}
