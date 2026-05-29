/**
 * Marées via WorldTides API (SHOM-compatible harmonics) avec repli local.
 */

import type { TidesData, Tide } from "@/lib/tides";

const STATION_LAT = -17.535;
const STATION_LON = -149.569;
const CACHE_MS = 6 * 60 * 60 * 1000;

let cache: { at: number; data: TidesData } | null = null;

function tahitiNow(): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const p = fmt.formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "00";
  return new Date(
    `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:00`,
  );
}

function formatHHhMM(isoUtc: string): string {
  return new Date(isoUtc)
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Tahiti",
    })
    .replace(":", "h");
}

type WorldTidesExtreme = {
  dt: number;
  date: string;
  height: number;
  type: "High" | "Low";
};

export async function fetchTidesFromApi(): Promise<TidesData | null> {
  const key = process.env.WORLD_TIDES_API_KEY?.trim();
  if (!key) return null;

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const now = tahitiNow();
  const start = Math.floor(now.getTime() / 1000);
  const url = new URL("https://www.worldtides.info/api/v3");
  url.searchParams.set("extremes", "");
  url.searchParams.set("lat", String(STATION_LAT));
  url.searchParams.set("lon", String(STATION_LON));
  url.searchParams.set("start", String(start));
  url.searchParams.set("length", String(36 * 3600));
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { extremes?: WorldTidesExtreme[] };
    const extremes = json.extremes ?? [];
    if (!extremes.length) return null;

    const tides: Tide[] = extremes.slice(0, 6).map((e) => {
      const eventMs = e.dt * 1000;
      return {
        time: formatHHhMM(new Date(eventMs).toISOString()),
        type: e.type === "High" ? "haute" : "basse",
        heightCm: Math.round(e.height * 100),
        minutesUntil: Math.max(0, Math.round((eventMs - Date.now()) / 60_000)),
      };
    });

    const data: TidesData = {
      date: now.toISOString().slice(0, 10),
      tides,
      source: "api",
      note: "Marées WorldTides (harmoniques SHOM). Vérifiez avant activité maritime.",
    };
    cache = { at: Date.now(), data };
    return data;
  } catch {
    return null;
  }
}
