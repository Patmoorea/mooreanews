/**
 * Calcul du lever/coucher du soleil et de la phase de la lune à Moorea.
 * Sans clé API : utilise sunrise-sunset.org (public, gratuit, illimité).
 */

import { MOOREA_COORDS } from "@/lib/constants";

export type SunMoonData = {
  date: string;
  sunrise: string;
  sunset: string;
  solarNoon: string;
  dayLength: string;
  moonPhase: string;
  moonIllumination: number;
};

const MOON_PHASES = [
  "Nouvelle lune 🌑",
  "Premier croissant 🌒",
  "Premier quartier 🌓",
  "Gibbeuse croissante 🌔",
  "Pleine lune 🌕",
  "Gibbeuse décroissante 🌖",
  "Dernier quartier 🌗",
  "Dernier croissant 🌘",
];

function formatTahiti(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Tahiti",
    })
    .replace(":", "h");
}

function formatDayLength(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

function moonPhase(date: Date): { name: string; illumination: number } {
  const ref = new Date("2000-01-06T18:14:00Z").getTime();
  const synodic = 29.530588853;
  const diffDays = (date.getTime() - ref) / (1000 * 60 * 60 * 24);
  const cycle = ((diffDays % synodic) + synodic) % synodic;
  const phase = cycle / synodic;
  const idx = Math.floor(phase * 8 + 0.5) % 8;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phase)) * 50);
  return { name: MOON_PHASES[idx]!, illumination };
}

export async function getSunMoonData(): Promise<SunMoonData> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const moon = moonPhase(today);

  try {
    const url = new URL("https://api.sunrise-sunset.org/json");
    url.searchParams.set("lat", String(MOOREA_COORDS.lat));
    url.searchParams.set("lng", String(MOOREA_COORDS.lon));
    url.searchParams.set("formatted", "0");
    url.searchParams.set("date", dateStr);

    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) throw new Error("API down");
    const json = await res.json();
    if (json.status !== "OK") throw new Error("Invalid response");

    return {
      date: dateStr,
      sunrise: formatTahiti(json.results.sunrise),
      sunset: formatTahiti(json.results.sunset),
      solarNoon: formatTahiti(json.results.solar_noon),
      dayLength: formatDayLength(json.results.day_length),
      moonPhase: moon.name,
      moonIllumination: moon.illumination,
    };
  } catch {
    return {
      date: dateStr,
      sunrise: "06h05",
      sunset: "18h15",
      solarNoon: "12h10",
      dayLength: "12h10",
      moonPhase: moon.name,
      moonIllumination: moon.illumination,
    };
  }
}
