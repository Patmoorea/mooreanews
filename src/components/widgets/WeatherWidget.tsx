"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Cloud, CloudRain, Sun, CloudSun, Droplets, Wind, Thermometer } from "lucide-react";

type WeatherData = {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windKmh: number;
  condition: string;
  icon: string;
  conditionMain: string;
};

function getWeatherIcon(condition: string, sizeClass = "h-14 w-14") {
  const c = condition.toLowerCase();
  if (c.includes("rain")) return <CloudRain className={sizeClass} />;
  if (c.includes("cloud")) return <CloudSun className={sizeClass} />;
  if (c.includes("clear")) return <Sun className={sizeClass} />;
  return <Cloud className={sizeClass} />;
}

export function WeatherWidget() {
  const t = useTranslations("widgets.weather");
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError(true);
      }
    };
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-7xl opacity-10 select-none">
        ☀️
      </div>
      <div className="relative">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-lagoon-700 mb-3">
          {t("title")}
        </h3>

        {error && (
          <div className="text-sm text-deep-700">
            <div className="text-3xl font-display">27°C</div>
            <div className="text-xs text-muted">Données par défaut</div>
          </div>
        )}

        {!error && !data && (
          <div className="animate-pulse">
            <div className="h-10 w-24 bg-lagoon-100 rounded mb-2" />
            <div className="h-3 w-32 bg-lagoon-100 rounded" />
          </div>
        )}

        {data && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-sunset-500">
                {getWeatherIcon(data.conditionMain)}
              </div>
              <div>
                <div className="text-5xl font-display text-deep-900 leading-none">
                  {data.temperature}°
                </div>
                <div className="text-xs text-muted mt-1 capitalize">
                  {data.condition}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-lagoon-100">
              <div className="flex flex-col items-center">
                <Thermometer className="h-4 w-4 text-sunset-500 mb-1" />
                <span className="text-[10px] uppercase text-muted">
                  {t("feels")}
                </span>
                <span className="text-sm font-semibold text-deep-900">
                  {data.feelsLike}°
                </span>
              </div>
              <div className="flex flex-col items-center">
                <Droplets className="h-4 w-4 text-lagoon-500 mb-1" />
                <span className="text-[10px] uppercase text-muted">
                  {t("humidity")}
                </span>
                <span className="text-sm font-semibold text-deep-900">
                  {data.humidity}%
                </span>
              </div>
              <div className="flex flex-col items-center">
                <Wind className="h-4 w-4 text-palm-500 mb-1" />
                <span className="text-[10px] uppercase text-muted">
                  {t("wind")}
                </span>
                <span className="text-sm font-semibold text-deep-900">
                  {data.windKmh} km/h
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
