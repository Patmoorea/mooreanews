/**
 * Textes courts « Moorea en 30 secondes » pour push et widgets.
 */

import type { MooreaDuJour } from "@/lib/moorea-du-jour";
import { humanEventTitle } from "@/lib/event-title";
import { getHealthOnCallUncached } from "@/lib/health-on-call";
import { tahitiParts } from "@/lib/tahiti-holidays";
import { articlePath } from "@/lib/article-url";

export function formatMorningBrief30s(d: MooreaDuJour): {
  title: string;
  body: string;
  eventSlug?: string;
  eventLabel?: string;
  linkPath?: string;
} {
  const parts: string[] = [];

  const ferry = d.ferries.fromMoorea[0] ?? d.ferries.fromTahiti[0];
  if (ferry) {
    parts.push(`⛴ ${ferry.time} ${ferry.company}`);
  } else {
    parts.push("⛴ Plus de départ ferry aujourd'hui");
  }

  parts.push(`${d.swim.emoji} Lagon ${d.swim.label.toLowerCase()}`);

  if (d.alerts.count > 0) {
    const outage = d.alerts.items.find((a) =>
      /coupure|électricité|electricite|eau potable|edt/i.test(a.title),
    );
    if (outage) {
      parts.push(`⚡ ${outage.title.slice(0, 55)}`);
    } else {
      parts.push(`⚠️ ${d.alerts.count} alerte(s)`);
    }
  } else {
    parts.push("✅ 0 alerte");
  }

  // Priorité : événement DU JOUR → une actu → (vendredi seulement) aperçu week-end.
  // Évite de republier la même affiche d'agenda tous les matins du WE.
  const { dow } = tahitiParts(new Date());
  const todayEv = d.todayEvents[0];
  const headline = d.headlines[0];
  const weekendEv = dow === 5 ? d.weekendEvents[0] : undefined;

  let eventSlug: string | undefined;
  let eventLabel: string | undefined;
  let linkPath: string | undefined;

  if (todayEv) {
    eventLabel = humanEventTitle(todayEv.title);
    eventSlug = todayEv.slug;
    linkPath = `/evenements/${todayEv.slug}`;
    parts.push(`📅 ${eventLabel}`);
  } else if (headline) {
    eventLabel = headline.title;
    eventSlug = headline.slug;
    linkPath = articlePath(headline);
    parts.push(`📰 ${eventLabel}`);
  } else if (weekendEv) {
    eventLabel = humanEventTitle(weekendEv.title);
    eventSlug = weekendEv.slug;
    linkPath = `/evenements/${weekendEv.slug}`;
    parts.push(`📅 WE · ${eventLabel}`);
  }

  const title = "🌺 Moorea en 30 secondes";
  const body = parts.join(" · ").slice(0, 220);
  return {
    title,
    body,
    eventSlug,
    eventLabel,
    linkPath,
  };
}

/** Ajoute médecin / pharmacie de garde au brief du matin (week-end & fériés). */
export async function enrichMorningBriefWithGarde(
  brief: ReturnType<typeof formatMorningBrief30s>,
): Promise<ReturnType<typeof formatMorningBrief30s>> {
  try {
    const health = await getHealthOnCallUncached();
    if (!health.showProminent && !health.onDutyDoctor && !health.onDutyPharmacy) {
      return brief;
    }
    const bits: string[] = [];
    if (health.onDutyDoctor?.name) {
      bits.push(`🩺 ${health.onDutyDoctor.name}`);
    }
    if (health.onDutyPharmacy?.name) {
      const short = health.onDutyPharmacy.name
        .replace(/^Pharmacies de garde\s*\(/i, "")
        .replace(/\)$/, "")
        .trim();
      bits.push(`💊 ${short || health.onDutyPharmacy.name}`);
    }
    if (!bits.length) return brief;

    const gardeLine = bits.join(" · ");
    const body = `${brief.body} · ${gardeLine}`.slice(0, 280);
    return {
      ...brief,
      body,
      linkPath: brief.linkPath ?? "/sante-garde",
    };
  } catch {
    return brief;
  }
}

export function formatEveningBrief(d: MooreaDuJour): { title: string; body: string } {
  const parts: string[] = [];

  if (d.openRestaurantsNow.length > 0) {
    parts.push(`🍽 ${d.openRestaurantsNow.length} resto(s) ouverts`);
    parts.push(d.openRestaurantsNow[0]!.name.slice(0, 30));
  }

  const ev = d.todayEvents.find((e) => e.time && parseInt(e.time, 10) >= 17) ?? d.todayEvents[0];
  if (ev) {
    parts.push(`📅 ${humanEventTitle(ev.title, "Agenda du soir")}`);
  }

  parts.push(`${d.weather.temp}°C ${d.weather.description.toLowerCase()}`);

  return {
    title: "🌙 Ce soir à Moorea",
    body: parts.join(" · ").slice(0, 220) || "Agenda et restos sur MooreaNews.",
  };
}
