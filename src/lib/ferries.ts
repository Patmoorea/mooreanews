/**
 * Récupère et traite les horaires de ferries Tahiti ↔ Moorea
 * depuis horaires-tahiti.com (JSON agrégé Aremiti + Tauati + Vaeara'i).
 * Copie locale data/ferries-schedules.json en secours si fetch live échoue.
 */

import bundledSchedules from "../../data/ferries-schedules.json";

export type Direction = "Tahiti to Moorea" | "Moorea to Tahiti";
export type DayKey =
  | "Lundi"
  | "Mardi"
  | "Mercredi"
  | "Jeudi"
  | "Vendredi"
  | "Samedi"
  | "Dimanche";

export type Departure = {
  time: string;
  company: string;
  duration: string;
  minutesUntil: number;
};

export type NextDepartures = {
  fromMoorea: Departure[];
  fromTahiti: Departure[];
  fetchedAt: string;
  source: "horaires-tahiti.com" | "horaires-tahiti.com (cache)" | "unavailable";
};

const SOURCE_URL = "https://www.horaires-tahiti.com/The.json";

const WEEKDAY_FROM_EN: Record<string, DayKey> = {
  Mon: "Lundi",
  Tue: "Mardi",
  Wed: "Mercredi",
  Thu: "Jeudi",
  Fri: "Vendredi",
  Sat: "Samedi",
  Sun: "Dimanche",
};

type RawSchedule = {
  company: string;
  direction: Direction;
  durationMinutes?: number;
  schedule: Partial<Record<DayKey, string[]>>;
};

type CompanySchedules = {
  meta?: { dureeTrajet?: string };
  TahitiVersMoorea?: Partial<Record<DayKey, string[]>>;
  MooreaVersTahiti?: Partial<Record<DayKey, string[]>>;
};

type RawData = {
  /** Format actuel (2025+) */
  compagnies?: Record<string, CompanySchedules>;
  /** Ancien format */
  companies?: Array<{
    company?: string;
    direction?: Direction;
    durationMinutes?: number;
    schedule?: Partial<Record<DayKey, string[]>>;
  }>;
};

export type RawFerryData = RawData;

function getTahitiClock(): { nowMin: number; dayKey: DayKey } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const dayKey =
    WEEKDAY_FROM_EN[get("weekday")] ??
    WEEKDAY_FROM_EN[get("weekday").slice(0, 3)] ??
    "Lundi";

  return { nowMin: hour * 60 + minute, dayKey };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatTimeFR(t: string): string {
  const [h, m] = t.split(":");
  return `${h}h${m ?? "00"}`;
}

function parseDurationMinutes(raw?: string): number | undefined {
  if (!raw?.trim()) return undefined;
  const m = raw.match(/(\d+)/);
  return m ? Number(m[1]) : undefined;
}

function sanitizeDayTimes(times: string[] | undefined): string[] {
  return (times ?? []).filter(
    (t) =>
      typeof t === "string" &&
      /^\d{1,2}:\d{2}$/.test(t.trim()) &&
      !/pas de rotation/i.test(t),
  );
}

function sanitizeSchedule(
  schedule: Partial<Record<DayKey, string[]>> | undefined,
): Partial<Record<DayKey, string[]>> {
  if (!schedule) return {};
  const out: Partial<Record<DayKey, string[]>> = {};
  for (const [day, times] of Object.entries(schedule)) {
    const clean = sanitizeDayTimes(times);
    if (clean.length > 0) out[day as DayKey] = clean;
  }
  return out;
}

/** Normalise le JSON horaires-tahiti.com (nouveau + ancien format). */
export function normalizeFerrySchedules(raw: RawData | null): RawSchedule[] {
  if (!raw) return [];

  if (raw.compagnies && Object.keys(raw.compagnies).length > 0) {
    const result: RawSchedule[] = [];
    for (const [name, data] of Object.entries(raw.compagnies)) {
      const durationMinutes = parseDurationMinutes(data.meta?.dureeTrajet);
      const tahiti = sanitizeSchedule(data.TahitiVersMoorea);
      const moorea = sanitizeSchedule(data.MooreaVersTahiti);

      if (Object.keys(tahiti).length > 0) {
        result.push({
          company: name,
          direction: "Tahiti to Moorea",
          durationMinutes,
          schedule: tahiti,
        });
      }
      if (Object.keys(moorea).length > 0) {
        result.push({
          company: name,
          direction: "Moorea to Tahiti",
          durationMinutes,
          schedule: moorea,
        });
      }
    }
    return result;
  }

  return (raw.companies ?? [])
    .map((c) => ({
      company: c.company ?? "—",
      direction: c.direction ?? "Tahiti to Moorea",
      durationMinutes: c.durationMinutes,
      schedule: sanitizeSchedule(c.schedule),
    }))
    .filter((c) => Object.keys(c.schedule).length > 0);
}

/** Récupération live depuis horaires-tahiti.com (JSON officiel agrégé). */
export async function fetchRawFerries(): Promise<RawData | null> {
  try {
    const res = await fetch(SOURCE_URL, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "MooreaNews/1.0 (+https://mooreanews.com; ferry schedule widget)",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as RawData;
    if (!data.compagnies && !data.companies) return null;
    return data;
  } catch {
    return null;
  }
}

function loadBundledFerries(): RawData {
  return bundledSchedules as RawData;
}

/** Live d’abord, sinon copie locale (même JSON que horaires-tahiti.com). */
export async function loadFerrySchedules(): Promise<{
  raw: RawData;
  source: NextDepartures["source"];
}> {
  const live = await fetchRawFerries();
  if (live) {
    return { raw: live, source: "horaires-tahiti.com" };
  }
  return {
    raw: loadBundledFerries(),
    source: "horaires-tahiti.com (cache)",
  };
}

/** Prochain départ de chaque compagnie (pour le bandeau). */
export function nextDeparturesPerCompany(departures: Departure[]): Departure[] {
  const byCompany = new Map<string, Departure>();
  for (const d of departures) {
    if (!byCompany.has(d.company)) byCompany.set(d.company, d);
  }
  return [...byCompany.values()].sort(
    (a, b) => a.minutesUntil - b.minutesUntil,
  );
}

export function computeNextDepartures(
  raw: RawData | null,
  source: NextDepartures["source"] = "horaires-tahiti.com",
): NextDepartures {
  const { nowMin, dayKey } = getTahitiClock();
  const companies = normalizeFerrySchedules(raw);

  const fromMoorea: Departure[] = [];
  const fromTahiti: Departure[] = [];

  for (const company of companies) {
    const times = company.schedule[dayKey] ?? [];
    for (const t of times) {
      const m = timeToMinutes(t);
      if (m < nowMin) continue;
      const dep: Departure = {
        time: formatTimeFR(t),
        company: company.company,
        duration: company.durationMinutes
          ? `${company.durationMinutes} min`
          : "30 min",
        minutesUntil: m - nowMin,
      };
      if (company.direction === "Moorea to Tahiti") fromMoorea.push(dep);
      else if (company.direction === "Tahiti to Moorea") fromTahiti.push(dep);
    }
  }

  fromMoorea.sort((a, b) => a.minutesUntil - b.minutesUntil);
  fromTahiti.sort((a, b) => a.minutesUntil - b.minutesUntil);

  if (fromMoorea.length === 0 && fromTahiti.length === 0) {
    return {
      fromMoorea: [],
      fromTahiti: [],
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
    };
  }

  return {
    fromMoorea: fromMoorea.slice(0, 8),
    fromTahiti: fromTahiti.slice(0, 8),
    fetchedAt: new Date().toISOString(),
    source,
  };
}

export function formatMinutesUntil(min: number): string {
  if (min <= 0) return "En cours";
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `dans ${h}h` : `dans ${h}h${String(m).padStart(2, "0")}`;
}
