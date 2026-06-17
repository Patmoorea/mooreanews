/**
 * Thèmes visuels saisonniers — couleurs & décos selon les grands événements.
 * Appliqué via data-season sur <html> + composant SeasonalDecor.
 */

import type { Event } from "@/lib/content-types";
import { getEvents } from "@/lib/content";
import { tahitiPublicHolidays } from "@/lib/tahiti-holidays";

export type SeasonThemeId =
  | "coupe-monde"
  | "heiva"
  | "hawaiki-nui"
  | "noel"
  | "nouvel-an"
  | "fete-musique"
  | "fete-autonomie"
  | "juillet-14"
  | "paques"
  | "toussaint"
  | "baleines"
  | "xterra"
  | "matiti-run";

export type SeasonThemeMeta = {
  id: SeasonThemeId;
  label: string;
  /** Motifs flottants (emoji discrets). */
  motifs: string[];
};

/** Calendrier des temps forts — plages Tahiti, ajustables chaque année. */
export const SEASON_THEME_CATALOG: Record<SeasonThemeId, SeasonThemeMeta> = {
  "coupe-monde": {
    id: "coupe-monde",
    label: "Coupe du monde",
    motifs: ["⚽", "🏆", "🌍"],
  },
  heiva: {
    id: "heiva",
    label: "Heiva i Moorea",
    motifs: ["🌺", "💃", "🥁"],
  },
  "hawaiki-nui": {
    id: "hawaiki-nui",
    label: "Hawaiki Nui Va'a",
    motifs: ["🛶", "🌊", "🏝️"],
  },
  noel: {
    id: "noel",
    label: "Noël",
    motifs: ["🎄", "⭐", "🎁"],
  },
  "nouvel-an": {
    id: "nouvel-an",
    label: "Nouvel An & Tūrai",
    motifs: ["🎆", "✨", "🥂"],
  },
  "fete-musique": {
    id: "fete-musique",
    label: "Fête de la musique",
    motifs: ["🎵", "🎸", "🎤"],
  },
  "fete-autonomie": {
    id: "fete-autonomie",
    label: "Fête de l’Autonomie",
    motifs: ["🇵🇫", "🌺", "🎭"],
  },
  "juillet-14": {
    id: "juillet-14",
    label: "14 juillet",
    motifs: ["🇫🇷", "🎆", "🎇"],
  },
  paques: {
    id: "paques",
    label: "Pâques",
    motifs: ["🐣", "🌼", "🥚"],
  },
  toussaint: {
    id: "toussaint",
    label: "Toussaint",
    motifs: ["🌸", "🕯️", "🌿"],
  },
  baleines: {
    id: "baleines",
    label: "Saison baleines",
    motifs: ["🐋", "🌊", "🐚"],
  },
  xterra: {
    id: "xterra",
    label: "XTERRA Moorea",
    motifs: ["🏃", "⛰️", "🚴"],
  },
  "matiti-run": {
    id: "matiti-run",
    label: "Matiti Run",
    motifs: ["🏃", "🌴", "💪"],
  },
};

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

export function getSeasonThemeMeta(
  id: SeasonThemeId | null,
): SeasonThemeMeta | null {
  if (!id) return null;
  return SEASON_THEME_CATALOG[id];
}

/** Couleur barre navigateur selon le thème actif. */
export function seasonThemeColor(id: SeasonThemeId | null): string {
  switch (id) {
    case "coupe-monde":
      return "#16a34a";
    case "heiva":
      return "#c026d3";
    case "hawaiki-nui":
      return "#ea580c";
    case "noel":
      return "#dc2626";
    case "nouvel-an":
      return "#ca8a04";
    case "fete-musique":
      return "#9333ea";
    case "fete-autonomie":
    case "juillet-14":
      return "#2563eb";
    case "paques":
      return "#eab308";
    case "toussaint":
      return "#78716c";
    case "baleines":
      return "#0284c7";
    case "xterra":
    case "matiti-run":
      return "#059669";
    default:
      return "#06b6d4";
  }
}
