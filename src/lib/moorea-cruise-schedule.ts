/**
 * Escales paquebots à Moorea.
 * - Tahiti Cruise Club : escales des 7 prochains jours (référence locale).
 * - CruiseTimetables.com : calendrier mensuel Moorea (complément / horizon long).
 */

import { unstable_cache } from "next/cache";
import {
  fetchTccPublicStopovers,
  parseTccDateLabel,
  TCC_SOURCE_LABEL,
  TCC_SOURCE_URL,
} from "@/lib/tahiti-cruise-club";

/** Calendrier mensuel CruiseTimetables (horizon long) — ~1×/mois suffit. */
export const CRUISE_TIMETABLES_REVALIDATE_SEC = 30 * 24 * 60 * 60;
/** Agenda Moorea (TCC 7 jours + fusion) — plusieurs fois par jour. */
export const MOOREA_CRUISE_REVALIDATE_SEC = 6 * 60 * 60;

/** Alias : page/API paquebots « Port de Papeete » uniquement. */
export const CRUISE_SCHEDULE_REVALIDATE_SEC = CRUISE_TIMETABLES_REVALIDATE_SEC;

export const MOOREA_CRUISE_SOURCE_URL =
  "https://www.cruisetimetables.com/mooreafrenchpolynesiaschedule.html";
export const MOOREA_CRUISE_SOURCE_LABEL = "CruiseTimetables.com";

const MONTH_SLUGS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export type MooreaCruiseSource = "tcc" | "cruisetimetables";

export type MooreaCruiseVisit = {
  id: string;
  shipName: string;
  visitAt: string;
  dateKey: string;
  timeLabel: string;
  sources: MooreaCruiseSource[];
};

export type MooreaCruiseScheduleResult = {
  fetchedAt: string;
  sources: { label: string; url: string; role: string }[];
  visits: MooreaCruiseVisit[];
};

function tahitiDateParts(d = new Date()): { year: number; monthIndex: number } {
  const key = d.toLocaleDateString("en-CA", { timeZone: "Pacific/Tahiti" });
  const [y, m] = key.split("-").map(Number);
  return { year: y, monthIndex: m - 1 };
}

function monthScheduleUrl(year: number, monthIndex: number): string {
  const slug = MONTH_SLUGS[monthIndex];
  return `https://www.cruisetimetables.com/mooreafrenchpolynesiaschedule-${slug}${year}.html`;
}

function parseDayNumber(dayLabel: string): number | null {
  const m = dayLabel.match(/(\d{1,2})/);
  return m ? Number.parseInt(m[1], 10) : null;
}

function formatTimesLabel(raw: string): string {
  const t = raw.trim();
  const arr = t.match(/a\s*(\d{2})(\d{2})/i);
  const dep = t.match(/d\s*(\d{2})(\d{2})/i);
  if (arr && dep) return `${arr[1]}:${arr[2]}–${dep[1]}:${dep[2]}`;
  if (arr) return `arrivée ${arr[1]}:${arr[2]}`;
  if (dep) return `départ ${dep[1]}:${dep[2]}`;
  return t;
}

function formatClockRange(arrival: string, departure: string): string {
  const a = arrival.trim();
  const d = departure.trim();
  if (a && d) return `${a}–${d}`;
  if (a) return `arrivée ${a}`;
  if (d) return `départ ${d}`;
  return "";
}

function visitIsoFromParts(
  dateKey: string,
  hour: string,
  minute: string,
): string {
  return new Date(`${dateKey}T${hour}:${minute}:00-10:00`).toISOString();
}

function visitIsoFromCruisetimetables(
  year: number,
  monthIndex: number,
  day: number,
  rawTimes: string,
): string {
  const arr = rawTimes.match(/a\s*(\d{2})(\d{2})/i);
  const dep = rawTimes.match(/d\s*(\d{2})(\d{2})/i);
  const hh = arr?.[1] ?? dep?.[1] ?? "08";
  const mm = arr?.[2] ?? dep?.[2] ?? "00";
  const month = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return new Date(`${year}-${month}-${dd}T${hh}:${mm}:00-10:00`).toISOString();
}

function visitKey(shipName: string, dateKey: string): string {
  return `${shipName.toUpperCase().replace(/\s+/g, "-")}-${dateKey}`;
}

function mergeVisit(
  map: Map<string, MooreaCruiseVisit>,
  partial: Omit<MooreaCruiseVisit, "sources"> & { source: MooreaCruiseSource },
) {
  const existing = map.get(partial.id);
  if (!existing) {
    map.set(partial.id, { ...partial, sources: [partial.source] });
    return;
  }
  if (!existing.sources.includes(partial.source)) {
    existing.sources.push(partial.source);
  }
  if (partial.source === "tcc") {
    existing.timeLabel = partial.timeLabel;
    existing.visitAt = partial.visitAt;
  }
}

function tccRowsToVisits(rows: Awaited<ReturnType<typeof fetchTccPublicStopovers>>) {
  const map = new Map<string, MooreaCruiseVisit>();
  for (const row of rows) {
    if (row.island.trim().toLowerCase() !== "moorea") continue;
    const dateKey = parseTccDateLabel(row.etaDateLabel);
    if (!dateKey) continue;
    const timeLabel = formatClockRange(row.etaTime, row.etdTime);
    const [hh, mm] = (row.etaTime || "08:00").split(":");
    mergeVisit(map, {
      id: visitKey(row.shipName, dateKey),
      shipName: row.shipName,
      visitAt: visitIsoFromParts(dateKey, hh || "08", mm || "00"),
      dateKey,
      timeLabel,
      source: "tcc",
    });
  }
  return map;
}

function parseCruisetimetablesMonth(
  html: string,
  year: number,
  monthIndex: number,
): Map<string, MooreaCruiseVisit> {
  const map = new Map<string, MooreaCruiseVisit>();
  const chunks = html.split("<div class='psovde-listing'");
  let currentDay: string | null = null;

  for (const chunk of chunks.slice(1)) {
    const dayMatch = chunk.match(/class='psovde-day'>\s*([^<]+)/);
    if (dayMatch) {
      currentDay = dayMatch[1].replace(/<br\s*\/?>.*/i, "").trim();
    }
    const shipMatch = chunk.match(
      /class='psovde-ship'>\s*<a[^>]*>([^<]+)<\/a>/,
    );
    const timesMatch = chunk.match(/class='psovde-times'>\s*([^<]+)/);
    if (!shipMatch || !currentDay) continue;

    const dayNum = parseDayNumber(currentDay);
    if (!dayNum) continue;

    const shipName = shipMatch[1].trim();
    const rawTimes = (timesMatch?.[1] ?? "").trim();
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

    mergeVisit(map, {
      id: visitKey(shipName, dateKey),
      shipName,
      visitAt: visitIsoFromCruisetimetables(year, monthIndex, dayNum, rawTimes),
      dateKey,
      timeLabel: formatTimesLabel(rawTimes),
      source: "cruisetimetables",
    });
  }

  return map;
}

async function fetchCruisetimetablesMonths(): Promise<Map<string, MooreaCruiseVisit>> {
  const { year, monthIndex } = tahitiDateParts();
  const months: { year: number; monthIndex: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const idx = monthIndex + i;
    months.push({
      year: year + Math.floor(idx / 12),
      monthIndex: idx % 12,
    });
  }

  const merged = new Map<string, MooreaCruiseVisit>();
  for (const m of months) {
    try {
      const url = monthScheduleUrl(m.year, m.monthIndex);
      const res = await fetch(url, {
        headers: {
          Accept: "text/html",
          "User-Agent":
            "MooreaNews/1.0 (+https://www.mooreanews.com; Moorea cruise schedule)",
        },
        next: { revalidate: CRUISE_TIMETABLES_REVALIDATE_SEC },
      });
      if (!res.ok) continue;
      const html = await res.text();
      for (const [k, v] of parseCruisetimetablesMonth(html, m.year, m.monthIndex)) {
        mergeVisit(merged, { ...v, source: "cruisetimetables" });
        void k;
      }
    } catch {
      /* mois indisponible */
    }
  }
  return merged;
}

async function buildMooreaCruiseSchedule(): Promise<MooreaCruiseScheduleResult> {
  const merged = new Map<string, MooreaCruiseVisit>();

  try {
    const tccRows = await fetchTccPublicStopovers();
    for (const [k, v] of tccRowsToVisits(tccRows)) {
      merged.set(k, v);
    }
  } catch {
    /* TCC indisponible : on garde CruiseTimetables seul */
  }

  for (const [, v] of await fetchCruisetimetablesMonths()) {
    mergeVisit(merged, {
      id: v.id,
      shipName: v.shipName,
      visitAt: v.visitAt,
      dateKey: v.dateKey,
      timeLabel: v.timeLabel,
      source: "cruisetimetables",
    });
  }

  const visits = [...merged.values()].sort(
    (a, b) => Date.parse(a.visitAt) - Date.parse(b.visitAt),
  );

  return {
    fetchedAt: new Date().toISOString(),
    sources: [
      {
        label: TCC_SOURCE_LABEL,
        url: TCC_SOURCE_URL,
        role: "7 prochains jours (escales publiques)",
      },
      {
        label: MOOREA_CRUISE_SOURCE_LABEL,
        url: MOOREA_CRUISE_SOURCE_URL,
        role: "calendrier mensuel Moorea",
      },
    ],
    visits,
  };
}

const loadMooreaCruiseScheduleCached = unstable_cache(
  buildMooreaCruiseSchedule,
  ["moorea-cruise-schedule-merged"],
  {
    revalidate: MOOREA_CRUISE_REVALIDATE_SEC,
    tags: ["moorea-cruise-ships"],
  },
);

export async function getMooreaCruiseSchedule(): Promise<MooreaCruiseScheduleResult> {
  return loadMooreaCruiseScheduleCached();
}

/** Toutes les escales Moorea à venir (sans limite artificielle de lignes). */
export function filterUpcomingMooreaVisits(
  visits: MooreaCruiseVisit[],
  now = Date.now(),
): MooreaCruiseVisit[] {
  const cutoff = now - 12 * 60 * 60 * 1000;
  return visits.filter((v) => Date.parse(v.visitAt) >= cutoff);
}

export function sourceBadgeLabel(sources: MooreaCruiseSource[]): string {
  const hasTcc = sources.includes("tcc");
  const hasCt = sources.includes("cruisetimetables");
  if (hasTcc && hasCt) return "TCC + CruiseTimetables";
  if (hasTcc) return "Tahiti Cruise Club";
  return "CruiseTimetables";
}
