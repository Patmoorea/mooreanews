/**
 * Conseils baignade / lagon à partir des marées et de la météo.
 */

import { getTides } from "@/lib/tides";
import type { WeatherSummary } from "@/lib/weather";

export type SwimStatus = "excellent" | "correct" | "prudence" | "deconseille";

export type SwimConditions = {
  status: SwimStatus;
  label: string;
  advice: string;
  nextTide: { time: string; type: "haute" | "basse" } | null;
  windKmh: number;
  emoji: string;
};

function statusFromInputs(
  windKmh: number,
  nextTideType: "haute" | "basse" | null,
  minutesToTide: number,
): SwimStatus {
  if (windKmh >= 35) return "deconseille";
  if (windKmh >= 25) return "prudence";
  if (nextTideType === "basse" && minutesToTide <= 90) return "prudence";
  if (windKmh >= 18) return "correct";
  return "excellent";
}

const STATUS_META: Record<
  SwimStatus,
  { label: string; advice: string; emoji: string }
> = {
  excellent: {
    label: "Conditions favorables",
    advice: "Lagon calme — idéal pour le snorkel côté nord et Temae.",
    emoji: "🟢",
  },
  correct: {
    label: "Conditions correctes",
    advice: "Vent modéré — privilégiez les zones abritées du lagon.",
    emoji: "🟡",
  },
  prudence: {
    label: "Prudence recommandée",
    advice: "Marée basse ou vent — attention aux récifs et à la houle.",
    emoji: "🟠",
  },
  deconseille: {
    label: "Baignade déconseillée",
    advice: "Vent fort — évitez le lagon et les sorties en mer.",
    emoji: "🔴",
  },
};

export function getSwimConditionsFromTides(
  weather: WeatherSummary,
  tides: import("@/lib/tides").TidesData,
): SwimConditions {
  const next = tides.tides[0] ?? null;
  const status = statusFromInputs(
    weather.windSpeed,
    next?.type ?? null,
    next?.minutesUntil ?? 999,
  );
  const meta = STATUS_META[status];

  return {
    status,
    label: meta.label,
    advice: meta.advice,
    emoji: meta.emoji,
    windKmh: Math.round(weather.windSpeed),
    nextTide: next ? { time: next.time, type: next.type } : null,
  };
}

export async function getSwimConditions(
  weather: WeatherSummary,
): Promise<SwimConditions> {
  const tides = await getTides();
  return getSwimConditionsFromTides(weather, tides);
}
