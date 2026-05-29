/**
 * Horaires en direct depuis les bases Firebase des compagnies
 * (même source que les sites aremitiexpress.com et vaearai.com).
 */

import type { Departure } from "@/lib/ferries";

const AREMITI_DB =
  "https://aremiti-1d663-default-rtdb.europe-west1.firebasedatabase.app";
const VAEARAI_DB = "https://terevaupiti-default-rtdb.firebaseio.com";

type FirebaseTrip = {
  id?: number;
  origin?: string;
  destination?: string;
  timeBegin?: number;
  dateBegin?: number;
  vessel?: string;
  status?: number;
  day?: number;
};

function tahitiParts(now = new Date()): {
  year: number;
  month: number;
  day: number;
  jsDay: number;
  nowMin: number;
  isoWeek: number;
  mondayIndex: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const weekday = get("weekday");
  const jsDayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const jsDay = jsDayMap[weekday] ?? 0;
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  const isoWeek = isoWeekNumber(year, month, day);

  return {
    year,
    month,
    day,
    jsDay,
    nowMin: hour * 60 + minute,
    isoWeek,
    mondayIndex: (jsDay + 6) % 7,
  };
}

function isoWeekNumber(year: number, month: number, day: number): number {
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatTimeFR(secondsFromMidnight: number): string {
  const totalMin = Math.floor(secondsFromMidnight / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h${String(m).padStart(2, "0")}`;
}

function tripToDeparture(
  trip: FirebaseTrip,
  company: string,
  nowMin: number,
): Departure | null {
  if (trip.timeBegin == null) return null;
  if (trip.dateBegin != null && trip.dateBegin < Date.now() - 10 * 60 * 1000) {
    return null;
  }
  const tripMin = Math.floor(trip.timeBegin / 60);
  if (tripMin < nowMin) return null;

  return {
    time: formatTimeFR(trip.timeBegin),
    company,
    duration: company.includes("Vaeara") ? "50 min" : "30 min",
    minutesUntil: tripMin - nowMin,
  };
}

function collectTrips(node: unknown): FirebaseTrip[] {
  const out: FirebaseTrip[] = [];
  if (!node || typeof node !== "object") return out;

  if (Array.isArray(node)) {
    for (const item of node) {
      if (item && typeof item === "object") {
        if ("timeBegin" in item) out.push(item as FirebaseTrip);
        else out.push(...collectTrips(item));
      }
    }
    return out;
  }

  for (const v of Object.values(node as Record<string, unknown>)) {
    if (v && typeof v === "object" && "timeBegin" in v) {
      out.push(v as FirebaseTrip);
    } else {
      out.push(...collectTrips(v));
    }
  }
  return out;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchAremitiToday(): Promise<{
  fromMoorea: Departure[];
  fromTahiti: Departure[];
}> {
  const { year, isoWeek, jsDay, nowMin } = tahitiParts();
  const [toMoorea, toTahiti] = await Promise.all([
    fetchJson<Record<string, FirebaseTrip>>(
      `${AREMITI_DB}/Calendar/${year}/${isoWeek}/MOZ/${jsDay}.json`,
    ),
    fetchJson<Record<string, FirebaseTrip>>(
      `${AREMITI_DB}/Calendar/${year}/${isoWeek}/PPT/${jsDay}.json`,
    ),
  ]);

  const fromTahiti: Departure[] = [];
  const fromMoorea: Departure[] = [];

  for (const trip of collectTrips(toMoorea)) {
    if (trip.origin === "PPT" && trip.destination === "MOZ") {
      const d = tripToDeparture(trip, "Aremiti Express", nowMin);
      if (d) fromTahiti.push(d);
    }
  }
  for (const trip of collectTrips(toTahiti)) {
    if (trip.origin === "MOZ" && trip.destination === "PPT") {
      const d = tripToDeparture(trip, "Aremiti Express", nowMin);
      if (d) fromMoorea.push(d);
    }
  }

  fromTahiti.sort((a, b) => a.minutesUntil - b.minutesUntil);
  fromMoorea.sort((a, b) => a.minutesUntil - b.minutesUntil);
  return { fromMoorea, fromTahiti };
}

async function fetchVaearaiToday(): Promise<{
  fromMoorea: Departure[];
  fromTahiti: Departure[];
}> {
  const { year, isoWeek, mondayIndex, nowMin } = tahitiParts();
  const [mozWeek, pptWeek] = await Promise.all([
    fetchJson<unknown>(`${VAEARAI_DB}/Calendar/${year}/${isoWeek}/MOZ.json`),
    fetchJson<unknown>(`${VAEARAI_DB}/Calendar/${year}/${isoWeek}/PPT.json`),
  ]);

  const mozDay = Array.isArray(mozWeek) ? mozWeek[mondayIndex] : null;
  const pptDay = Array.isArray(pptWeek) ? pptWeek[mondayIndex] : null;

  const fromTahiti: Departure[] = [];
  const fromMoorea: Departure[] = [];

  for (const trip of collectTrips(mozDay)) {
    if (trip.origin === "PPT" && trip.destination === "MOZ") {
      const d = tripToDeparture(trip, "Vaeara'i", nowMin);
      if (d) fromTahiti.push(d);
    }
  }
  for (const trip of collectTrips(pptDay)) {
    if (trip.origin === "MOZ" && trip.destination === "PPT") {
      const d = tripToDeparture(trip, "Vaeara'i", nowMin);
      if (d) fromMoorea.push(d);
    }
  }

  fromTahiti.sort((a, b) => a.minutesUntil - b.minutesUntil);
  fromMoorea.sort((a, b) => a.minutesUntil - b.minutesUntil);
  return { fromMoorea, fromTahiti };
}

function mergeDepartures(
  lists: { fromMoorea: Departure[]; fromTahiti: Departure[] }[],
): { fromMoorea: Departure[]; fromTahiti: Departure[] } {
  const fromMoorea = lists.flatMap((l) => l.fromMoorea);
  const fromTahiti = lists.flatMap((l) => l.fromTahiti);
  fromMoorea.sort((a, b) => a.minutesUntil - b.minutesUntil);
  fromTahiti.sort((a, b) => a.minutesUntil - b.minutesUntil);
  return { fromMoorea, fromTahiti };
}

/** Horaires du jour : Aremiti + Vaeara'i (Firebase officiel). */
export async function fetchFirebaseDepartures(): Promise<{
  fromMoorea: Departure[];
  fromTahiti: Departure[];
  ok: boolean;
}> {
  const results = await Promise.all([
    fetchAremitiToday(),
    fetchVaearaiToday(),
  ]);
  const merged = mergeDepartures(results);
  const ok =
    merged.fromMoorea.length > 0 || merged.fromTahiti.length > 0;
  return { ...merged, ok };
}
