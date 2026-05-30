/**
 * Textes courts « Moorea en 30 secondes » pour push et widgets.
 */

import type { MooreaDuJour } from "@/lib/moorea-du-jour";

export function formatMorningBrief30s(d: MooreaDuJour): { title: string; body: string } {
  const parts: string[] = [];

  const ferry = d.ferries.fromMoorea[0] ?? d.ferries.fromTahiti[0];
  if (ferry) {
    parts.push(`⛴ ${ferry.time} ${ferry.company}`);
  } else {
    parts.push("⛴ Plus de départ ferry aujourd'hui");
  }

  parts.push(`${d.swim.emoji} Lagon ${d.swim.label.toLowerCase()}`);

  if (d.alerts.count > 0) {
    parts.push(`⚠️ ${d.alerts.count} alerte(s)`);
  } else {
    parts.push("✅ 0 alerte");
  }

  const ev = d.todayEvents[0] ?? d.weekendEvents[0];
  if (ev) {
    parts.push(`📅 ${ev.title.slice(0, 40)}`);
  }

  const title = "🌺 Moorea en 30 secondes";
  const body = parts.join(" · ").slice(0, 220);
  return { title, body };
}

export function formatEveningBrief(d: MooreaDuJour): { title: string; body: string } {
  const parts: string[] = [];

  if (d.openRestaurantsNow.length > 0) {
    parts.push(`🍽 ${d.openRestaurantsNow.length} resto(s) ouverts`);
    parts.push(d.openRestaurantsNow[0]!.name.slice(0, 30));
  }

  const ev = d.todayEvents.find((e) => e.time && parseInt(e.time, 10) >= 17) ?? d.todayEvents[0];
  if (ev) {
    parts.push(`📅 ${ev.title.slice(0, 35)}`);
  }

  parts.push(`${d.weather.temp}°C ${d.weather.description.toLowerCase()}`);

  return {
    title: "🌙 Ce soir à Moorea",
    body: parts.join(" · ").slice(0, 220) || "Agenda et restos sur MooreaNews.",
  };
}
