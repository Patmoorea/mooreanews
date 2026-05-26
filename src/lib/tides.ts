/**
 * Marées indicatives Moorea — algorithme simplifié.
 *
 * Pour MVP : on calcule des marées indicatives en partant d'une référence
 * de marée haute connue, avec un cycle approximatif de 12h25 (cycle lunaire semi-diurne).
 * Pour production : remplacer par une API officielle (SHOM, NOAA WorldTides, etc.).
 */

export type Tide = {
  time: string;
  type: "haute" | "basse";
  heightCm: number;
  minutesUntil: number;
};

export type TidesData = {
  date: string;
  tides: Tide[];
  source: "computed" | "api";
  note: string;
};

const CYCLE_MINUTES = 12 * 60 + 25; // 12h25
const HIGH_TIDE_HEIGHT_CM = 38;
const LOW_TIDE_HEIGHT_CM = 4;

/** Référence : marée haute connue à Papeete (proche de Moorea). */
const REFERENCE_HIGH = new Date("2025-01-01T03:30:00Z").getTime();

function getPolynesiaNow(): Date {
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

function formatHHhMM(date: Date): string {
  return date
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Tahiti",
    })
    .replace(":", "h");
}

export function getTides(): TidesData {
  const now = getPolynesiaNow();
  const dateStr = now.toISOString().slice(0, 10);

  // Trouver la prochaine pleine mer après now
  const minutesSinceRef = Math.floor(
    (now.getTime() - REFERENCE_HIGH) / 60000
  );
  const offsetWithinCycle = ((minutesSinceRef % CYCLE_MINUTES) + CYCLE_MINUTES) %
    CYCLE_MINUTES;
  const minutesToNextHigh = (CYCLE_MINUTES - offsetWithinCycle) % CYCLE_MINUTES;

  const tides: Tide[] = [];
  // Génère 4 marées (2 hautes, 2 basses) sur les ~25 prochaines heures
  for (let i = 0; i < 4; i++) {
    const isHigh = i % 2 === 0;
    const offsetMin =
      minutesToNextHigh + (i * CYCLE_MINUTES) / 2;
    const eventTime = new Date(now.getTime() + offsetMin * 60_000);
    tides.push({
      time: formatHHhMM(eventTime),
      type: isHigh ? "haute" : "basse",
      heightCm: isHigh ? HIGH_TIDE_HEIGHT_CM : LOW_TIDE_HEIGHT_CM,
      minutesUntil: Math.round(offsetMin),
    });
  }

  return {
    date: dateStr,
    tides,
    source: "computed",
    note: "Horaires indicatifs. Vérifiez auprès du SHOM ou de la capitainerie avant toute activité maritime.",
  };
}
