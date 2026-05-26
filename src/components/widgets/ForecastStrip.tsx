"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  CloudDrizzle,
  Snowflake,
  CloudFog,
} from "lucide-react";
import type { ForecastDay } from "@/lib/weather";

const ICON_FOR_CODE: Record<string, React.ReactNode> = {
  "01d": <Sun size={28} className="text-soleil-500" />,
  "01n": <Sun size={28} className="text-ocean-300" />,
  "02d": <CloudSun size={28} className="text-soleil-400" />,
  "02n": <CloudSun size={28} className="text-ocean-300" />,
  "03d": <Cloud size={28} className="text-ocean-300" />,
  "04d": <Cloud size={28} className="text-ocean-400" />,
  "09d": <CloudDrizzle size={28} className="text-lagon-500" />,
  "10d": <CloudRain size={28} className="text-lagon-600" />,
  "11d": <CloudRain size={28} className="text-tiare-500" />,
  "13d": <Snowflake size={28} className="text-lagon-300" />,
  "50d": <CloudFog size={28} className="text-ocean-300" />,
};

const DAY_FR: Record<string, string> = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mer",
  Thu: "Jeu",
  Fri: "Ven",
  Sat: "Sam",
  Sun: "Dim",
};

function formatDay(dateStr: string): { label: string; day: number } {
  const d = new Date(dateStr + "T12:00:00");
  const en = d.toLocaleDateString("en-US", { weekday: "short" });
  return { label: DAY_FR[en] ?? en, day: d.getDate() };
}

export function ForecastStrip() {
  const [data, setData] = useState<ForecastDay[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/forecast")
      .then((r) => r.json() as Promise<ForecastDay[]>)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items = data ?? Array(5).fill(null);

  return (
    <div className="rounded-3xl bg-white border border-ocean-100 p-6 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-lagon-600 font-semibold">
            Prévisions
          </p>
          <h3 className="font-display text-xl text-ocean-900 leading-none mt-1">
            5 prochains jours
          </h3>
        </div>
        <span className="text-xs text-ocean-500">Moorea</span>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {items.slice(0, 5).map((d, i) => {
          if (!d) {
            return (
              <div
                key={i}
                className="bg-ocean-50 rounded-2xl p-3 sm:p-4 text-center animate-pulse h-32"
              />
            );
          }
          const { label, day } = formatDay(d.date);
          return (
            <div
              key={d.date}
              className="bg-gradient-to-b from-ocean-50 to-lagon-50 rounded-2xl p-3 sm:p-4 text-center"
            >
              <p className="text-xs uppercase tracking-wide text-ocean-600 font-semibold">
                {label}
              </p>
              <p className="font-display text-2xl text-ocean-900 mt-0.5">
                {day}
              </p>
              <div className="my-2 flex justify-center">
                {ICON_FOR_CODE[d.icon] ?? ICON_FOR_CODE["02d"]}
              </div>
              <p className="text-xs text-ocean-700">
                <strong>{Math.round(d.tempMax)}°</strong>{" "}
                <span className="text-ocean-400">{Math.round(d.tempMin)}°</span>
              </p>
              {d.precipitation > 0 && (
                <p className="text-[10px] text-lagon-600 mt-0.5">
                  {d.precipitation}%
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
