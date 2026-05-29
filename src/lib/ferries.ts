/**
 * Récupère et traite les horaires de ferries Tahiti ↔ Moorea
 * depuis horaires-tahiti.com (source publique, MAJ hebdo).
 */

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
  source: "horaires-tahiti.com" | "fallback";
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

/** Récupération brute du JSON depuis horaires-tahiti.com. */
export async function fetchRawFerries(): Promise<RawData | null> {
  try {
    const res = await fetch(SOURCE_URL, {
      next: { revalidate: 1800 },
      headers: {
        Accept: "application/json",
        "User-Agent":
          "MooreaNews/1.0 (+https://mooreanews.com; ferry schedule widget)",
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as RawData;
  } catch {
    return null;
  }
}

export function computeNextDepartures(raw: RawData | null): NextDepartures {
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
      fromMoorea: fallbackDepartures("Moorea"),
      fromTahiti: fallbackDepartures("Tahiti"),
      fetchedAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  return {
    fromMoorea: fromMoorea.slice(0, 6),
    fromTahiti: fromTahiti.slice(0, 6),
    fetchedAt: new Date().toISOString(),
    source: "horaires-tahiti.com",
  };
}

function fallbackDepartures(from: "Moorea" | "Tahiti"): Departure[] {
  const baseTimes =
    from === "Moorea"
      ? ["06:00", "07:30", "09:00", "12:00", "15:30"]
      : ["07:00", "10:30", "14:00", "16:00", "17:30"];
  const { nowMin } = getTahitiClock();
  return baseTimes
    .map((t) => {
      const m = timeToMinutes(t);
      return {
        time: formatTimeFR(t),
        company: "Indicatif",
        duration: "30 min",
        minutesUntil: Math.max(0, m - nowMin),
      };
    })
    .filter((d) => d.minutesUntil > 0)
    .slice(0, 3);
}

export function formatMinutesUntil(min: number): string {
  if (min <= 0) return "En cours";
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `dans ${h}h` : `dans ${h}h${String(m).padStart(2, "0")}`;
}
