/**
 * Créneaux baignade / snorkel par plage — marées + score vent.
 */

import { MOOREA_BEACHES } from "@/lib/beaches";
import { getBeachSwimScores } from "@/lib/swim-beaches";
import { getTides, type Tide } from "@/lib/tides";

export type BeachTideSlot = {
  beachSlug: string;
  beachName: string;
  emoji: string;
  label: string;
  status: string;
  nextTide: { time: string; type: string } | null;
  bestWindow: string;
  tip: string;
};

function bestWindowForBeach(
  tide: Tide | undefined,
  exposure: string,
): { window: string; tip: string } {
  if (!tide) {
    return {
      window: "Consultez les marées du jour",
      tip: "Arrivez tôt le matin si le vent est faible.",
    };
  }

  const isLow = tide.type === "basse";
  const tideLabel = isLow ? "basse marée" : "marée haute";

  if (exposure === "north" || exposure === "east") {
    return isLow
      ? {
          window: `Snorkel ~1h avant/après ${tide.time} (${tideLabel})`,
          tip: "Lagon plus calme à marée basse sur les spots nord.",
        }
      : {
          window: `Baignade possible autour de ${tide.time}`,
          tip: "Marée haute : plus d'eau, moins de récifs accessibles à pied.",
        };
  }

  return {
    window: `Fenêtre favorable près de ${tide.time}`,
    tip: `Vent côté ${exposure} — privilégiez les zones abritées.`,
  };
}

export async function getBeachTideSlots(): Promise<BeachTideSlot[]> {
  const [scores, tides] = await Promise.all([
    getBeachSwimScores(),
    getTides(),
  ]);

  const nextTide = tides.tides[0];

  return scores.map((s) => {
    const beach = MOOREA_BEACHES.find((b) => b.slug === s.beach.slug);
    const { window, tip } = bestWindowForBeach(
      nextTide,
      beach?.exposure ?? "north",
    );

    return {
      beachSlug: s.beach.slug,
      beachName: s.beach.name,
      emoji: s.emoji,
      label: s.label,
      status: s.status,
      nextTide: nextTide
        ? { time: nextTide.time, type: nextTide.type }
        : null,
      bestWindow: window,
      tip,
    };
  });
}
