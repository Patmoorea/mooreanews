"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { MAP_MARKERS, MOOREA_CENTER, type MapMarker } from "@/lib/map-locations";

type CategoryFilter = "all" | MapMarker["category"];

const FILTERS: { value: CategoryFilter; label: string; color: string }[] = [
  { value: "all", label: "Tout", color: "bg-ocean-700" },
  { value: "restaurant", label: "Restaurants", color: "bg-couchant" },
  { value: "activite", label: "Activités", color: "bg-tipanier-500" },
  { value: "plage", label: "Plages", color: "bg-lagon-500" },
  { value: "ferry", label: "Transports", color: "bg-ocean-600" },
  { value: "info", label: "Infos", color: "bg-tiare-500" },
];

const CATEGORY_COLORS: Record<MapMarker["category"], string> = {
  restaurant: "#fb923c",
  activite: "#10b981",
  plage: "#06b6d4",
  ferry: "#0284c7",
  info: "#f43f5e",
};

export function MooreaMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [ready, setReady] = useState(false);

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

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      mapRef.current = map;
      renderMarkers(filter);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) renderMarkers(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready]);

  async function renderMarkers(cat: CategoryFilter) {
    const map = mapRef.current;
    if (!map) return;
    const L = (await import("leaflet")).default;

    // Nettoyer les marqueurs existants
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];

    const filtered = MAP_MARKERS.filter(
      (m) => cat === "all" || m.category === cat
    );

    for (const m of filtered) {
      const color = CATEGORY_COLORS[m.category];
      const icon = L.divIcon({
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
          ${m.description ? `<p style="margin:4px 0 0;font-size:13px;color:#075985">${m.description}</p>` : ""}
          ${m.href ? `<a href="${m.href}" style="display:inline-block;margin-top:6px;color:#0e7490;font-size:12px;font-weight:600">En savoir plus →</a>` : ""}
        </div>`
      );
      markersRef.current.push(marker);
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-tropical)]">
      <div className="p-4 sm:p-5 border-b border-ocean-100">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.value
                  ? `${f.color} text-white shadow-md`
                  : "bg-ocean-50 text-ocean-700 hover:bg-ocean-100"
              }`}
            >
              {f.label}
            </button>
          ))}
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
  }
}
