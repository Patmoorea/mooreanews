import { getRestaurants, getActivities, getInfoPratiques } from "@/lib/content";
import {
  STATIC_MAP_MARKERS,
  type MapMarker,
} from "@/lib/map-locations";
import { resolveMapIconUrl } from "@/lib/map-marker-logos";

function coords(
  lat?: number | null,
  lon?: number | null,
): { lat: number; lon: number } | null {
  if (
    lat == null ||
    lon == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }
  return { lat, lon };
}

/** Marqueurs affichés sur la carte : points fixes + contenu admin (lat/lon). */
export async function buildMapMarkers(): Promise<MapMarker[]> {
  const [restaurants, activities, infos] = await Promise.all([
    getRestaurants(),
    getActivities(),
    getInfoPratiques(),
  ]);

  const fromAdmin: MapMarker[] = [];

  for (const r of restaurants) {
    const c = coords(r.lat, r.lon);
    if (!c) continue;
    fromAdmin.push({
      id: `restaurant-${r.slug}`,
      name: r.name,
      category: "restaurant",
      lat: c.lat,
      lon: c.lon,
      description: r.address,
      href: `/restaurants/${r.slug}`,
      district: r.district,
    });
  }

  for (const a of activities) {
    const c = coords(a.lat, a.lon);
    if (!c) continue;
    fromAdmin.push({
      id: `activity-${a.slug}`,
      name: a.name,
      category: "activite",
      lat: c.lat,
      lon: c.lon,
      description: a.district ?? a.description.slice(0, 80),
      href: `/activites/${a.slug}`,
      district: a.district,
    });
  }

  for (const i of infos) {
    const c = coords(i.lat, i.lon);
    if (!c) continue;
    fromAdmin.push({
      id: `info-${i.slug}`,
      name: i.title,
      category: "info",
      lat: c.lat,
      lon: c.lon,
      description: i.address ?? i.description.slice(0, 100),
      href: `/infos-pratiques/${i.slug}`,
      iconUrl: resolveMapIconUrl(i.slug, i.mapIconUrl),
    });
  }

  const dynamicIds = new Set(fromAdmin.map((m) => m.id));
  const staticFiltered = STATIC_MAP_MARKERS.filter((m) => {
    if (m.id === "rai-tahiti-pihaena" && dynamicIds.has("info-rai-tahiti-vsl")) {
      return false;
    }
    return true;
  });

  return [...staticFiltered, ...fromAdmin];
}
