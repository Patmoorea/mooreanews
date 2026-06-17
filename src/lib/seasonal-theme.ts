/**
 * Thèmes saisonnels MooreaNews — logo, bannière et couleurs selon la période.
 * Assets : public/brand/seasonal/
 */

import { SITE } from "@/lib/constants";
import { SEASONAL_THEME_META, type SeasonalThemeId } from "@/lib/seasonal-theme-meta";

export type { SeasonalThemeId };

const SEASONAL_BASE = "/brand/seasonal";

export type SeasonalAssets = {
  logo: string;
  banner: string | null;
};

export type ActiveSeasonalTheme = {
  id: SeasonalThemeId;
  label: string;
  assets: SeasonalAssets;
  cssVars: Record<string, string>;
};

type DateRange = {
  /** Mois 1–12 */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

type ThemeSchedule = {
  id: SeasonalThemeId;
  ranges: DateRange[];
};

/** Ordre de priorité : le premier thème actif l’emporte. */
const THEME_SCHEDULE: ThemeSchedule[] = [
  {
    id: "nouvel-an",
    ranges: [{ startMonth: 12, startDay: 20, endMonth: 1, endDay: 7 }],
  },
  {
    id: "saint-valentin",
    ranges: [{ startMonth: 2, startDay: 1, endMonth: 2, endDay: 16 }],
  },
  {
    id: "paques",
    ranges: [{ startMonth: 3, startDay: 20, endMonth: 4, endDay: 25 }],
  },
  {
    id: "heiva",
    ranges: [{ startMonth: 7, startDay: 1, endMonth: 7, endDay: 31 }],
  },
  {
    id: "hawaiki-nui",
    ranges: [{ startMonth: 10, startDay: 20, endMonth: 10, endDay: 31 }],
  },
  {
    id: "rentree-scolaire",
    ranges: [{ startMonth: 8, startDay: 15, endMonth: 9, endDay: 15 }],
  },
  {
    id: "baleines",
    ranges: [{ startMonth: 8, startDay: 1, endMonth: 11, endDay: 15 }],
  },
  {
    id: "octobre-rose",
    ranges: [{ startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 }],
  },
  {
    id: "coupe-du-monde",
    ranges: [{ startMonth: 6, startDay: 1, endMonth: 7, endDay: 20 }],
  },
  {
    id: "noel",
    ranges: [{ startMonth: 12, startDay: 1, endMonth: 12, endDay: 19 }],
  },
  {
    id: "anniversaire",
    ranges: [{ startMonth: 6, startDay: 1, endMonth: 6, endDay: 7 }],
  },
];

function dayOfYear(month: number, day: number): number {
  const days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  return days[month - 1]! + day;
}

function isInRange(
  month: number,
  day: number,
  { startMonth, startDay, endMonth, endDay }: DateRange,
): boolean {
  const current = dayOfYear(month, day);
  const start = dayOfYear(startMonth, startDay);
  const end = dayOfYear(endMonth, endDay);

  if (start <= end) {
    return current >= start && current <= end;
  }
  return current >= start || current <= end;
}

export function getSeasonalThemeId(
  date: Date = new Date(),
  timezone = SITE.timezone,
): SeasonalThemeId | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  for (const theme of THEME_SCHEDULE) {
    if (theme.ranges.some((range) => isInRange(month, day, range))) {
      return theme.id;
    }
  }
  return null;
}

export function getSeasonalAssets(id: SeasonalThemeId): SeasonalAssets {
  return {
    logo: `${SEASONAL_BASE}/logos/${id}.png`,
    banner: SEASONAL_THEME_META[id].hasBanner
      ? `${SEASONAL_BASE}/banners/${id}.png`
      : null,
  };
}

export function getActiveSeasonalTheme(
  date: Date = new Date(),
): ActiveSeasonalTheme | null {
  const id = getSeasonalThemeId(date);
  if (!id) return null;

  const meta = SEASONAL_THEME_META[id];
  return {
    id,
    label: meta.label,
    assets: getSeasonalAssets(id),
    cssVars: meta.cssVars,
  };
}

export function getSiteLogo(date: Date = new Date()): string {
  const theme = getActiveSeasonalTheme(date);
  return theme?.assets.logo ?? SITE.logo;
}
