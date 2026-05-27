"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  Gauge,
} from "lucide-react";
import type { WeatherSummary } from "@/lib/weather";

const ICON_MAP: Record<string, React.ReactNode> = {
  "01d": <Sun size={56} className="text-soleil-300" />,
  "01n": <Sun size={56} className="text-ocean-100" />,
  "02d": <CloudSun size={56} className="text-soleil-200" />,
  "02n": <Cloud size={56} className="text-ocean-100" />,
  "03d": <Cloud size={56} className="text-ocean-100" />,
  "04d": <Cloud size={56} className="text-ocean-200" />,
  "09d": <CloudRain size={56} className="text-lagon-200" />,
  "10d": <CloudRain size={56} className="text-lagon-200" />,
  "11d": <CloudRain size={56} className="text-tiare-200" />,
  "13d": <Cloud size={56} className="text-white" />,
  "50d": <Cloud size={56} className="text-ocean-200" />,
};

function compassDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8] ?? "N";
}

export function WeatherCard() {
  const [data, setData] = useState<WeatherSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((r) => r.json() as Promise<WeatherSummary>)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lagon-500 via-ocean-600 to-ocean-800 text-white p-6 shadow-[var(--shadow-tropical)]">
      <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-soleil-400/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-lagon-100/80">
              Météo en direct
            </p>
            <h3 className="font-display text-2xl mt-1">Moorea</h3>
          </div>
          <div>
            {data ? ICON_MAP[data.icon] ?? ICON_MAP["02d"] : (
              <CloudSun size={56} className="text-soleil-200/50" />
            )}
          </div>
        </div>

        <div className="mt-6 flex items-end gap-4">
          <span className="font-display text-6xl leading-none">
            {data ? Math.round(data.temp) : "—"}°
          </span>
          <div className="pb-2 text-sm text-lagon-100/90">
            <p>{data?.description ?? "Chargement…"}</p>
            <p>Ressenti {data ? Math.round(data.feelsLike) : "—"}°</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <Droplets size={14} className="mb-1 text-lagon-100" />
            <p className="text-lagon-100/80">Humidité</p>
            <p className="font-semibold">{data?.humidity ?? "—"}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <Wind size={14} className="mb-1 text-lagon-100" />
            <p className="text-lagon-100/80">Vent</p>
            <p className="font-semibold">
              {data ? `${data.windSpeed} km/h ${compassDirection(data.windDirection)}` : "—"}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3">
            <Gauge size={14} className="mb-1 text-lagon-100" />
            <p className="text-lagon-100/80">Pression</p>
            <p className="font-semibold">{data?.pressure ?? "—"} hPa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
