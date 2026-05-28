"use client";

import { useEffect, useState } from "react";
import { ThermometerSun } from "lucide-react";
import type { WeatherSummary } from "@/lib/weather";

export function HeroWeatherPill() {
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weather")
      .then((r) => (r.ok ? r.json() : null))
      .then((w: WeatherSummary | null) => {
        if (!cancelled && w?.temp != null) setTemp(Math.round(w.temp));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (temp == null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold">
      <ThermometerSun size={14} className="text-soleil-300" />
      Moorea {temp}°C
    </span>
  );
}
