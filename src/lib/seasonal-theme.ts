/**
 * Résolution du thème saisonnier actif (serveur uniquement).
 */

import "server-only";

import type { Event } from "@/lib/content-types";
import { getEvents } from "@/lib/content";
import { tahitiPublicHolidays } from "@/lib/tahiti-holidays";
import type { SeasonThemeId } from "@/lib/seasonal-theme-meta";

export type { SeasonThemeId, SeasonThemeMeta } from "@/lib/seasonal-theme-meta";
export {
  SEASON_THEME_CATALOG,
  getSeasonThemeMeta,
  seasonThemeColor,
} from "@/lib/seasonal-theme-meta";

type EventMatchRule = {
  slugPatterns: RegExp[];
  titlePatterns: RegExp[];
  leadDays: number;
  trailDays?: number;
};

type SeasonThemeDefinition = {
  id: SeasonThemeId;
  priority: number;
  eventMatch?: EventMatchRule;
  fixedWindow?: (year: number) => { start: string; end: string } | null;
};

export function tahitiDateIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDaysIso(iso: string, delta: number): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function isActiveWindow(
  window: { start: string; end: string },
  today: string,
): boolean {
  return today >= window.start && today <= window.end;
}

function holidayIso(year: number, label: string): string | null {
  const h = tahitiPublicHolidays(year).find((x) => x.label === label);
  return h ? isoDate(year, h.month, h.day) : null;
}

function windowAround(iso: string, before: number, after: number) {
  return {
    start: addDaysIso(iso, -before),
    end: addDaysIso(iso, after),
  };
}

function normalizeMatch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function eventMatches(e: Event, rule: EventMatchRule): boolean {
  if (rule.slugPatterns.some((p) => p.test(e.slug))) return true;
  return rule.titlePatterns.some((p) => p.test(normalizeMatch(e.title)));
}

function pickBestMatchingEvent(
  events: Event[],
  rule: EventMatchRule,
): Event | null {
  const matches = events.filter((e) => eventMatches(e, rule));
  if (matches.length === 0) return null;

  const today = tahitiDateIso();
  const stillRelevant = matches.filter(
    (e) => addDaysIso((e.endDate ?? e.date).slice(0, 10), 1) >= today,
  );
  const pool = stillRelevant.length > 0 ? stillRelevant : matches;

  return pool.slice().sort((a, b) => a.date.localeCompare(b.date))[0];
}

function eventWindow(event: Event, rule: EventMatchRule) {
  const eventStart = event.date.slice(0, 10);
  const eventEnd = (event.endDate ?? event.date).slice(0, 10);
  return {
    start: addDaysIso(eventStart, -rule.leadDays),
    end: addDaysIso(eventEnd, rule.trailDays ?? 0),
  };
}

const SEASON_THEMES: SeasonThemeDefinition[] = [
  {
    id: "coupe-monde",
    priority: 90,
    fixedWindow: (year) =>
      year === 2026
        ? { start: "2026-06-01", end: "2026-07-20" }
        : null,
  },
  {
    id: "heiva",
    priority: 85,
    eventMatch: {
      slugPatterns: [/heiva/i],
      titlePatterns: [/heiva/i],
      leadDays: 14,
      trailDays: 2,
    },
    fixedWindow: (year) => ({
      start: isoDate(year, 6, 20),
      end: isoDate(year, 7, 31),
    }),
  },
  {
    id: "hawaiki-nui",
    priority: 88,
    eventMatch: {
      slugPatterns: [/hawaiki/i, /va-?a/i],
      titlePatterns: [/hawaiki nui/i, /hawaiki-nui/i, /va'a/i, /vaa va'a/i],
      leadDays: 10,
      trailDays: 2,
    },
    fixedWindow: (year) => ({
      start: isoDate(year, 10, 15),
      end: isoDate(year, 11, 5),
    }),
  },
  {
    id: "xterra",
    priority: 45,
    eventMatch: {
      slugPatterns: [/xterra/i],
      titlePatterns: [/xterra/i],
      leadDays: 7,
      trailDays: 1,
    },
    fixedWindow: (year) => ({
      start: isoDate(year, 10, 1),
      end: isoDate(year, 10, 31),
    }),
  },
  {
    id: "matiti-run",
    priority: 44,
    eventMatch: {
      slugPatterns: [/matiti/i],
      titlePatterns: [/matiti run/i, /matiti/i],
      leadDays: 7,
      trailDays: 1,
    },
    fixedWindow: (year) => ({
      start: isoDate(year, 3, 1),
      end: isoDate(year, 3, 31),
    }),
  },
  {
    id: "baleines",
    priority: 40,
    fixedWindow: (year) => ({
      start: isoDate(year, 8, 1),
      end: isoDate(year, 11, 15),
    }),
  },
  {
    id: "fete-musique",
    priority: 72,
    fixedWindow: (year) => windowAround(isoDate(year, 6, 21), 2, 1),
  },
  {
    id: "fete-autonomie",
    priority: 70,
    fixedWindow: (year) => windowAround(isoDate(year, 6, 29), 2, 1),
  },
  {
    id: "juillet-14",
    priority: 65,
    fixedWindow: (year) => windowAround(isoDate(year, 7, 14), 1, 1),
  },
  {
    id: "paques",
    priority: 50,
    fixedWindow: (year) => {
      const day = holidayIso(year, "Pâques");
      return day ? windowAround(day, 1, 2) : null;
    },
  },
  {
    id: "toussaint",
    priority: 48,
    fixedWindow: (year) => windowAround(isoDate(year, 11, 1), 1, 1),
  },
  {
    id: "noel",
    priority: 80,
    fixedWindow: (year) => ({
      start: addDaysIso(isoDate(year, 12, 25), -24),
      end: addDaysIso(isoDate(year, 12, 25), 1),
    }),
  },
  {
    id: "nouvel-an",
    priority: 75,
    fixedWindow: (year) => ({
      start: isoDate(year, 12, 28),
      end: isoDate(year + 1, 1, 5),
    }),
  },
];

function resolveThemeWindow(
  def: SeasonThemeDefinition,
  events: Event[],
  today: string,
): { start: string; end: string } | null {
  const year = Number(today.slice(0, 4));

  if (def.eventMatch) {
    const event = pickBestMatchingEvent(events, def.eventMatch);
    if (event) {
      const window = eventWindow(event, def.eventMatch);
      if (isActiveWindow(window, today)) return window;
    }
  }

  if (def.fixedWindow) {
    for (const y of [year - 1, year, year + 1]) {
      const window = def.fixedWindow(y);
      if (window && isActiveWindow(window, today)) return window;
    }
  }

  return null;
}

export function resolveActiveSeasonTheme(
  events: Event[],
  today = tahitiDateIso(),
): SeasonThemeId | null {
  if (process.env.NEXT_PUBLIC_SEASONAL_THEMES_ENABLED === "false") {
    return null;
  }

  let best: { id: SeasonThemeId; priority: number } | null = null;

  for (const def of SEASON_THEMES) {
    const window = resolveThemeWindow(def, events, today);
    if (!window) continue;
    if (!best || def.priority > best.priority) {
      best = { id: def.id, priority: def.priority };
    }
  }

  return best?.id ?? null;
}

export async function getActiveSeasonTheme(
  today = tahitiDateIso(),
): Promise<SeasonThemeId | null> {
  const events = await getEvents();
  return resolveActiveSeasonTheme(events, today);
}
