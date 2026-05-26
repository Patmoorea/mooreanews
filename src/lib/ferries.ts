/**
 * Récupère et traite les horaires de ferries Tahiti ↔ Moorea
 * depuis horaires-tahiti.com (source publique, manuelle, MAJ hebdo).
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

const SOURCE_URL = "https://horaires-tahiti.com/The.json";

const DAY_MAP: Record<number, DayKey> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

function getPolynesiaTime(): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:00`
  );
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatTimeFR(t: string): string {
  const [h, m] = t.split(":");
  return `${h}h${m ?? "00"}`;
}

type RawSchedule = {
  company?: string;
  direction?: Direction;
  durationMinutes?: number;
  schedule?: Partial<Record<DayKey, string[]>>;
};

type RawData = {
  companies?: RawSchedule[];
};

/** Récupération brute du JSON depuis horaires-tahiti.com. */
export async function fetchRawFerries(): Promise<RawData | null> {
  try {
    const res = await fetch(SOURCE_URL, {
      next: { revalidate: 1800 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as RawData;
  } catch {
    return null;
  }
}

export function computeNextDepartures(
  raw: RawData | null
): NextDepartures {
  const now = getPolynesiaTime();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayKey = DAY_MAP[now.getDay()] ?? "Lundi";

  const fromMoorea: Departure[] = [];
  const fromTahiti: Departure[] = [];

  if (raw?.companies) {
    for (const company of raw.companies) {
      const times = company.schedule?.[dayKey] ?? [];
      for (const t of times) {
        const m = timeToMinutes(t);
        if (m < nowMin) continue;
        const dep: Departure = {
          time: formatTimeFR(t),
          company: company.company ?? "—",
          duration: company.durationMinutes
            ? `${company.durationMinutes} min`
            : "30 min",
          minutesUntil: m - nowMin,
        };
        if (company.direction === "Moorea to Tahiti") fromMoorea.push(dep);
        else if (company.direction === "Tahiti to Moorea") fromTahiti.push(dep);
      }
    }
  }

  fromMoorea.sort((a, b) => a.minutesUntil - b.minutesUntil);
  fromTahiti.sort((a, b) => a.minutesUntil - b.minutesUntil);

  // Fallback minimal si pas de données : valeurs typiques
  const isEmpty = fromMoorea.length === 0 && fromTahiti.length === 0;
  if (isEmpty) {
    return {
      fromMoorea: fallbackDepartures("Moorea"),
      fromTahiti: fallbackDepartures("Tahiti"),
      fetchedAt: new Date().toISOString(),
      source: "fallback",
    };
  }

  return {
    fromMoorea: fromMoorea.slice(0, 5),
    fromTahiti: fromTahiti.slice(0, 5),
    fetchedAt: new Date().toISOString(),
    source: "horaires-tahiti.com",
  };
}

function fallbackDepartures(from: "Moorea" | "Tahiti"): Departure[] {
  const baseTimes =
    from === "Moorea"
      ? ["06:00", "07:30", "09:00", "12:00", "15:30"]
      : ["07:00", "10:30", "14:00", "16:00", "17:30"];
  const now = getPolynesiaTime();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return baseTimes
    .map((t) => {
      const m = timeToMinutes(t);
      return {
        time: formatTimeFR(t),
        company: "Aremiti / Terevau",
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
