/**
 * Score baignade par plage (vent + marée + exposition).
 */

import { MOOREA_BEACHES, type BeachSpot } from "@/lib/beaches";
import {
  getSwimConditionsFromTides,
  type SwimStatus,
} from "@/lib/swim-conditions";
import type { WeatherSummary } from "@/lib/weather";
import { getTides } from "@/lib/tides";

export type BeachSwimScore = {
  beach: BeachSpot;
  status: SwimStatus;
  label: string;
  emoji: string;
  advice: string;
};

function windPenaltyForBeach(windKmh: number, exposure: BeachSpot["exposure"]): number {
  if (exposure === "north") return windKmh * 0.7;
  if (exposure === "west") return windKmh * 1.1;
  if (exposure === "east") return windKmh * 1.05;
  return windKmh * 1.2;
}

function statusFromScore(adjustedWind: number, baseStatus: SwimStatus): SwimStatus {
  if (adjustedWind >= 32) return "deconseille";
  if (adjustedWind >= 22) return "prudence";
  if (baseStatus === "deconseille") return "deconseille";
  if (baseStatus === "prudence" || adjustedWind >= 16) return "prudence";
  if (adjustedWind >= 12) return "correct";
  return "excellent";
}

const STATUS_LABEL: Record<SwimStatus, { label: string; emoji: string }> = {
  excellent: { label: "Excellent", emoji: "🟢" },
  correct: { label: "Correct", emoji: "🟡" },
  prudence: { label: "Prudence", emoji: "🟠" },
  deconseille: { label: "Déconseillé", emoji: "🔴" },
};

export async function getBeachSwimScores(
  weather?: WeatherSummary,
): Promise<BeachSwimScore[]> {
  const { getCurrentWeather } = await import("@/lib/weather");
  const w = weather ?? (await getCurrentWeather());
  const tides = await getTides();
  const base = getSwimConditionsFromTides(w, tides);

  return MOOREA_BEACHES.filter((b) => b.snorkel).map((beach) => {
    const adj = windPenaltyForBeach(w.windSpeed, beach.exposure);
    const status = statusFromScore(adj, base.status);
    const meta = STATUS_LABEL[status];
    const advice =
      status === "excellent"
        ? `Bon spot snorkel — ${beach.name}.`
        : status === "correct"
          ? `Conditions moyennes à ${beach.name} — zones abritées.`
          : status === "prudence"
            ? `Vent ou marée — prudence à ${beach.name}.`
            : `Évitez ${beach.name} aujourd'hui.`;

    return {
      beach,
      status,
      label: meta.label,
      emoji: meta.emoji,
      advice,
    };
  });
}
