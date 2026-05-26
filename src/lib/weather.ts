/**
 * Récupération de la météo Moorea via OpenWeatherMap.
 * Si OPENWEATHERMAP_API_KEY n'est pas configurée, renvoie un fallback stable.
 */

import { MOOREA_COORDS, ENV } from "@/lib/constants";

export type WeatherSummary = {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudiness: number;
  city: string;
  fetchedAt: string;
  source: "openweathermap" | "fallback";
};

export type ForecastDay = {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  precipitation: number;
};

const FALLBACK: WeatherSummary = {
  temp: 28,
  feelsLike: 30,
  humidity: 76,
  description: "Partiellement nuageux",
  icon: "02d",
  windSpeed: 12,
  windDirection: 110,
  pressure: 1013,
  cloudiness: 45,
  city: "Moorea",
  fetchedAt: new Date().toISOString(),
  source: "fallback",
};

export async function getCurrentWeather(): Promise<WeatherSummary> {
  if (!ENV.openWeatherMapKey) return FALLBACK;

  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(MOOREA_COORDS.lat));
  url.searchParams.set("lon", String(MOOREA_COORDS.lon));
  url.searchParams.set("appid", ENV.openWeatherMapKey);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "fr");

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return FALLBACK;
    const data = await res.json();
    return {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description:
        (data.weather?.[0]?.description as string)?.replace(/^./, (c: string) =>
          c.toUpperCase()
        ) ?? "—",
      icon: data.weather?.[0]?.icon ?? "01d",
      windSpeed: Math.round(data.wind?.speed ?? 0),
      windDirection: data.wind?.deg ?? 0,
      pressure: data.main.pressure,
      cloudiness: data.clouds?.all ?? 0,
      city: "Moorea",
      fetchedAt: new Date().toISOString(),
      source: "openweathermap",
    };
  } catch {
    return FALLBACK;
  }
}

export async function getForecast(days = 5): Promise<ForecastDay[]> {
  if (!ENV.openWeatherMapKey) return generateFallbackForecast(days);

  const url = new URL("https://api.openweathermap.org/data/2.5/forecast");
  url.searchParams.set("lat", String(MOOREA_COORDS.lat));
  url.searchParams.set("lon", String(MOOREA_COORDS.lon));
  url.searchParams.set("appid", ENV.openWeatherMapKey);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "fr");

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return generateFallbackForecast(days);
    const data = await res.json();
    const list: {
      dt_txt: string;
      main: { temp_min: number; temp_max: number };
      weather: { description: string; icon: string }[];
      pop?: number;
    }[] = data.list ?? [];

    const byDay = new Map<string, ForecastDay>();
    for (const item of list) {
      const date = item.dt_txt.slice(0, 10);
      const existing = byDay.get(date);
      const tempMin = item.main.temp_min;
      const tempMax = item.main.temp_max;
      const desc = item.weather[0]?.description ?? "";
      if (!existing) {
        byDay.set(date, {
          date,
          tempMin,
          tempMax,
          description: desc.replace(/^./, (c) => c.toUpperCase()),
          icon: item.weather[0]?.icon ?? "01d",
          precipitation: Math.round((item.pop ?? 0) * 100),
        });
      } else {
        existing.tempMin = Math.min(existing.tempMin, tempMin);
        existing.tempMax = Math.max(existing.tempMax, tempMax);
      }
    }
    return Array.from(byDay.values()).slice(0, days);
  } catch {
    return generateFallbackForecast(days);
  }
}

function generateFallbackForecast(days: number): ForecastDay[] {
  const today = new Date();
  const out: ForecastDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push({
      date: d.toISOString().slice(0, 10),
      tempMin: 24 + (i % 2),
      tempMax: 30 - (i % 3),
      description: ["Ensoleillé", "Nuages épars", "Ondées tropicales"][i % 3],
      icon: ["01d", "02d", "10d"][i % 3] ?? "01d",
      precipitation: [10, 25, 60][i % 3],
    });
  }
  return out;
}
