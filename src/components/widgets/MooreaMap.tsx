"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { MapPin, Navigation } from "lucide-react";
import { MOOREA_CENTER, type MapMarker } from "@/lib/map-locations";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import { distanceKm } from "@/lib/map-utils";

type CategoryFilter = "all" | MapMarker["category"];

const FILTERS: { value: CategoryFilter; label: string; color: string }[] = [
  { value: "all", label: "Tout", color: "bg-ocean-700" },
  { value: "restaurant", label: "Restaurants", color: "bg-couchant" },
  { value: "activite", label: "Activités", color: "bg-tipanier-500" },
  { value: "plage", label: "Plages", color: "bg-lagon-500" },
  { value: "hebergement", label: "Hébergements", color: "bg-soleil-500" },
  { value: "ferry", label: "Transports", color: "bg-ocean-600" },
  { value: "info", label: "Infos", color: "bg-tiare-500" },
];

const CATEGORY_COLORS: Record<MapMarker["category"], string> = {
  restaurant: "#fb923c",
  activite: "#10b981",
  plage: "#06b6d4",
  hebergement: "#eab308",
  ferry: "#0284c7",
  info: "#f43f5e",
};

type Props = {
  markers: MapMarker[];
};

export function MooreaMap({ markers }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const userMarkerRef = useRef<CircleMarker | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [district, setDistrict] = useState<string>("all");
  const [nearMe, setNearMe] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [geoError, setGeoError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const visibleMarkers = useCallback((): MapMarker[] => {
    let list = markers.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (district !== "all" && m.district && m.district !== district)
        return false;
      return true;
    });

    if (nearMe && userPos) {
      list = [...list].sort(
        (a, b) =>
          distanceKm(userPos.lat, userPos.lon, a.lat, a.lon) -
          distanceKm(userPos.lat, userPos.lon, b.lat, b.lon),
      );
    }
    return list;
  }, [markers, category, district, nearMe, userPos]);

  const renderMarkers = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const L = (await import("leaflet")).default;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const filtered = visibleMarkers();

    for (const m of filtered) {
      const color = CATEGORY_COLORS[m.category];
      const distLabel =
        nearMe && userPos
          ? `<p style="margin:2px 0 0;font-size:11px;color:#64748b">${distanceKm(userPos.lat, userPos.lon, m.lat, m.lon).toFixed(1)} km</p>`
          : "";

      const icon = m.iconUrl
        ? L.divIcon({
            className: "moorea-marker moorea-marker-logo",
            html: logoMarkerHtml(m.iconUrl),
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -22],
          })
        : L.divIcon({
            className: "moorea-marker",
            html: `<div style="
          background:${color};
          width:28px;height:28px;border-radius:999px;
          border:3px solid white;
          box-shadow:0 4px 12px rgba(0,0,0,0.2);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:14px;font-weight:600;
        ">${markerEmoji(m.category)}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

      const marker = L.marker([m.lat, m.lon], { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:180px">
          <strong style="color:${color}">${m.name}</strong>
          ${m.district ? `<p style="margin:2px 0 0;font-size:11px;color:#64748b">${m.district}</p>` : ""}
          ${m.description ? `<p style="margin:4px 0 0;font-size:13px;color:#075985">${m.description}</p>` : ""}
          ${distLabel}
          ${m.href ? `<a href="${m.href}" style="display:inline-block;margin-top:6px;color:#0e7490;font-size:12px;font-weight:600">En savoir plus →</a>` : ""}
        </div>`,
      );
      markersRef.current.push(marker);
    }
  }, [visibleMarkers, nearMe, userPos]);

  function locateMe() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Géolocalisation non supportée");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserPos({ lat, lon });
        setNearMe(true);
        const map = mapRef.current;
        if (map) {
          map.setView([lat, lon], 13);
          const L = (await import("leaflet")).default;
          userMarkerRef.current?.remove();
          userMarkerRef.current = L.circleMarker([lat, lon], {
            radius: 8,
            color: "#0369a1",
            fillColor: "#06b6d4",
            fillOpacity: 0.9,
            weight: 3,
          })
            .addTo(map)
            .bindPopup("Vous êtes ici");
        }
      },
      () => setGeoError("Autorisez la localisation dans votre navigateur"),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: MOOREA_CENTER,
        zoom: 12,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      userMarkerRef.current?.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (ready) renderMarkers();
  }, [ready, renderMarkers]);

  return (
    <div className="bg-white rounded-3xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-tropical)]">
      <div className="p-4 sm:p-5 border-b border-ocean-100 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setCategory(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  category === f.value
                    ? `${f.color} text-white shadow-md`
                    : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={locateMe}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lagon-600 text-white text-xs font-semibold"
          >
            <Navigation size={14} />
            Près de moi
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <MapPin size={14} className="text-ocean-400" />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="text-xs rounded-full border border-ocean-200 px-3 py-1.5 bg-white text-ocean-800"
            aria-label="Filtrer par quartier"
          >
            <option value="all">Tous les quartiers</option>
            {MOOREA_DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {nearMe && userPos && (
            <span className="text-xs text-lagon-700 font-medium">
              Triés par distance
            </span>
          )}
          {geoError && (
            <span className="text-xs text-tiare-600">{geoError}</span>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full h-[420px] sm:h-[520px]"
        aria-label="Carte interactive de Moorea"
      />
    </div>
  );
}

function markerEmoji(cat: MapMarker["category"]): string {
  switch (cat) {
    case "restaurant":
      return "🍽";
    case "activite":
      return "🏝";
    case "plage":
      return "🏖";
    case "ferry":
      return "⛴";
    case "info":
      return "ⓘ";
    case "hebergement":
      return "🛏";
  }
}

function logoMarkerHtml(iconUrl: string): string {
  const src = iconUrl.replace(/"/g, "&quot;");
  return `<div style="
    width:40px;height:40px;border-radius:999px;
    border:3px solid white;
    box-shadow:0 4px 14px rgba(0,0,0,0.25);
    overflow:hidden;background:white;
    display:flex;align-items:center;justify-content:center;
  "><img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover" /></div>`;
}
