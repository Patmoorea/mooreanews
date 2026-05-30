/**
 * Marqueurs carte touriste : plages (scores), restaurants, événements à venir.
 */

import { MOOREA_BEACHES } from "@/lib/beaches";
import { getRestaurants, getUpcomingEvents } from "@/lib/content";
import { getBeachSwimScores } from "@/lib/swim-beaches";
import type { MapMarker } from "@/lib/map-locations";

const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Afareaitu: { lat: -17.554, lon: -149.775 },
  Haapiti: { lat: -17.478, lon: -149.865 },
  Maharepa: { lat: -17.501, lon: -149.771 },
  Papetoai: { lat: -17.489, lon: -149.839 },
  Paopao: { lat: -17.492, lon: -149.812 },
  Teavaro: { lat: -17.505, lon: -149.78 },
  Temae: { lat: -17.503, lon: -149.762 },
  Tiahura: { lat: -17.496, lon: -149.833 },
  Vaiare: { lat: -17.507, lon: -149.776 },
};

export type TouristMapMarker = MapMarker & {
  swimLabel?: string;
  swimEmoji?: string;
};

export async function buildTouristMapMarkers(): Promise<TouristMapMarker[]> {
  const [restaurants, events, beachScores] = await Promise.all([
    getRestaurants(),
    getUpcomingEvents(12),
    getBeachSwimScores(),
  ]);

  const markers: TouristMapMarker[] = [];

  for (const b of MOOREA_BEACHES.filter((p) => p.snorkel)) {
    const score = beachScores.find((s) => s.beach.slug === b.slug);
    markers.push({
      id: `beach-${b.slug}`,
      name: b.name,
      category: "plage",
      lat: b.lat,
      lon: b.lon,
      district: b.district,
      description: score?.advice ?? "Plage snorkel",
      swimLabel: score?.label,
      swimEmoji: score?.emoji,
    });
  }

  for (const r of restaurants) {
    if (r.lat == null || r.lon == null) continue;
    markers.push({
      id: `resto-${r.slug}`,
      name: r.name,
      category: "restaurant",
      lat: r.lat,
      lon: r.lon,
      district: r.district,
      description: r.address ?? r.district,
      href: `/restaurants/${r.slug}`,
    });
  }

  for (const e of events) {
    const district = e.district ?? "Paopao";
    const coords = DISTRICT_COORDS[district] ?? DISTRICT_COORDS.Paopao;
    const hash = e.slug.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    const offset = ((hash % 17) - 8) * 0.0004;
    markers.push({
      id: `event-${e.slug}`,
      name: e.title,
      category: "activite",
      lat: coords.lat + offset,
      lon: coords.lon + offset * 0.7,
      district,
      description: `${e.date}${e.time ? ` · ${e.time}` : ""} — ${e.location}`,
      href: `/evenements/${e.slug}`,
    });
  }

  markers.push({
    id: "vaiare-ferry-tourist",
    name: "Débarcadère Vaiare (ferry)",
    category: "ferry",
    lat: -17.4946,
    lon: -149.7672,
    district: "Vaiare",
    description: "Tahiti ↔ Moorea — horaires en direct sur MooreaNews",
    href: "/#en-direct",
  });

  return markers;
}
