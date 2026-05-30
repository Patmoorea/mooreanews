/**
 * Itinéraire « Mon séjour » — 48h ou 7 jours à partir des données live.
 */

import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { getBeachSwimScores } from "@/lib/swim-beaches";

export type TripDayPlan = {
  dayLabel: string;
  items: { time?: string; title: string; detail: string; href?: string }[];
};

export type TripPlan = {
  duration: "48h" | "7j";
  generatedAt: string;
  days: TripDayPlan[];
  shareText: string;
};

function bestBeachName(
  scores: Awaited<ReturnType<typeof getBeachSwimScores>>,
): string {
  const best = scores.find((s) => s.status === "excellent") ?? scores[0];
  return best?.beach.name ?? "Temae";
}

export async function buildTripPlan(
  duration: "48h" | "7j" = "48h",
): Promise<TripPlan> {
  const [digest, beaches] = await Promise.all([
    getMooreaDuJour(),
    getBeachSwimScores(),
  ]);
  const beach = bestBeachName(beaches);
  const base = digest.siteUrl;

  const day1: TripDayPlan = {
    dayLabel: "Jour 1",
    items: [
      {
        time: digest.ferries.fromTahiti[0]?.time,
        title: "Arrivée ferry",
        detail: digest.ferries.fromTahiti[0]
          ? `${digest.ferries.fromTahiti[0].company} ${digest.ferries.fromTahiti[0].time}`
          : "Consultez les horaires ferry",
        href: `${base}/#en-direct`,
      },
      {
        title: "Baignade lagon",
        detail: `${beach} — lagon ${digest.swim.label.toLowerCase()}`,
        href: `${base}/#en-direct`,
      },
      {
        title: "Sunset & dîner",
        detail:
          digest.openRestaurantsNow[0]?.name ??
          "Restaurants sur MooreaNews (voir /ce-soir)",
        href: `${base}/ce-soir`,
      },
    ],
  };

  const day2: TripDayPlan = {
    dayLabel: "Jour 2",
    items: [
      {
        title: "Snorkel matinal",
        detail: `Marées du jour — spot ${beach}`,
        href: `${base}/#en-direct`,
      },
      {
        title: "Activité",
        detail: "Kayak, belvédère ou sortie baleines (saison)",
        href: `${base}/activites`,
      },
      ...(digest.todayEvents[0]
        ? [
            {
              title: digest.todayEvents[0].title,
              detail: digest.todayEvents[0].location,
              href: `${base}/evenements/${digest.todayEvents[0].slug}`,
            },
          ]
        : []),
    ],
  };

  const days: TripDayPlan[] = [day1, day2];

  if (duration === "7j") {
    for (let i = 3; i <= 7; i += 1) {
      const ev = digest.weekendEvents[i - 3];
      days.push({
        dayLabel: `Jour ${i}`,
        items: [
          {
            title: ev?.title ?? "Explorer un quartier",
            detail: ev?.location ?? "Maharepa, Paopao, Afareaitu…",
            href: ev ? `${base}/evenements/${ev.slug}` : `${base}/guides`,
          },
          {
            title: "Plage du jour",
            detail: beaches[(i - 1) % beaches.length]?.beach.name ?? beach,
          },
        ],
      });
    }
  }

  const shareText = [
    `Mon séjour à Moorea (${duration})`,
    `⛴ ${digest.ferries.fromTahiti[0]?.time ?? "—"} ${digest.ferries.fromTahiti[0]?.company ?? ""}`,
    `🌊 Lagon ${digest.swim.label}`,
    digest.todayEvents[0]?.title,
    base,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    duration,
    generatedAt: digest.generatedAt,
    days,
    shareText,
  };
}
