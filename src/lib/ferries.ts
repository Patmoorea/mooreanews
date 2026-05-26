/**
 * Récupération + parsing des horaires ferry Tahiti ↔ Moorea.
 *
 * Source : https://www.horaires-tahiti.com/The.json (JSON public, mis à jour
 * par horaires-tahiti.com — site de référence en Polynésie).
 *
 * Fetch côté serveur avec cache Next.js (revalidate 30min). Lien de crédit
 * affiché sous la section côté UI.
 */

export type Direction = "TahitiVersMoorea" | "MooreaVersTahiti";

export type DayKey =
  | "Lundi"
  | "Mardi"
  | "Mercredi"
  | "Jeudi"
  | "Vendredi"
  | "Samedi"
  | "Dimanche";

export interface CompanyMeta {
  dureeTrajet?: string;
  site?: string;
  capacite?: number | string;
  capaciteVoitures?: number | string;
}

export interface CompanySchedule {
  meta?: CompanyMeta;
  TahitiVersMoorea?: Partial<Record<DayKey, string[]>>;
  MooreaVersTahiti?: Partial<Record<DayKey, string[]>>;
}

export interface FerryData {
  compagnies: Record<string, CompanySchedule>;
}

export interface Departure {
  company: string;
  time: string;
  minutesUntil: number;
  site?: string;
  duration?: string;
}

const DAYS_ORDER: DayKey[] = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export function getPolynesiaTime(now: Date = new Date()): {
  day: DayKey;
  hours: number;
  minutes: number;
  dayIndex: number;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10,
  );

  const map: Record<string, DayKey> = {
    Sunday: "Dimanche",
    Monday: "Lundi",
    Tuesday: "Mardi",
    Wednesday: "Mercredi",
    Thursday: "Jeudi",
    Friday: "Vendredi",
    Saturday: "Samedi",
  };
  const day = map[weekday] ?? "Lundi";
  return {
    day,
    hours: hour === 24 ? 0 : hour,
    minutes: minute,
    dayIndex: DAYS_ORDER.indexOf(day),
  };
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function computeNextDepartures(
  data: FerryData,
  direction: Direction,
  count: number = 4,
  now: Date = new Date(),
): Departure[] {
  const { hours, minutes, dayIndex } = getPolynesiaTime(now);
  const currentMinutes = hours * 60 + minutes;
  const compagnies = data.compagnies ?? {};

  const results: Departure[] = [];

  for (let offset = 0; offset < 7 && results.length < count; offset++) {
    const checkDay = DAYS_ORDER[(dayIndex + offset) % 7];
    const dayOffsetMinutes = offset * 24 * 60;

    type Candidate = { company: string; time: string; mins: number };
    const candidates: Candidate[] = [];

    for (const [companyName, schedule] of Object.entries(compagnies)) {
      const times = schedule[direction]?.[checkDay];
      if (!times) continue;
      for (const t of times) {
        const mins = timeToMinutes(t) + dayOffsetMinutes;
        if (offset === 0 && timeToMinutes(t) < currentMinutes) continue;
        candidates.push({ company: companyName, time: t, mins });
      }
    }

    candidates.sort((a, b) => a.mins - b.mins);

    for (const c of candidates) {
      if (results.length >= count) break;
      const meta = compagnies[c.company]?.meta;
      results.push({
        company: c.company,
        time: c.time,
        minutesUntil: c.mins - currentMinutes,
        site: meta?.site,
        duration: meta?.dureeTrajet,
      });
    }
  }

  return results;
}

export function formatMinutesUntil(minutes: number, locale: string): string {
  const fr = locale === "fr";
  const en = locale === "en";

  if (minutes <= 0) return fr ? "à quai" : en ? "at dock" : "i te uahu";
  if (minutes < 60) {
    return fr ? `dans ${minutes} min` : en ? `in ${minutes} min` : `i te ${minutes} miti`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return fr
      ? `dans ${hours}h${mins.toString().padStart(2, "0")}`
      : en
        ? `in ${hours}h${mins.toString().padStart(2, "0")}`
        : `i te ${hours}h${mins.toString().padStart(2, "0")}`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return fr
    ? `dans ${days}j ${remHours}h`
    : en
      ? `in ${days}d ${remHours}h`
      : `i te ${days} mahana ${remHours}h`;
}
