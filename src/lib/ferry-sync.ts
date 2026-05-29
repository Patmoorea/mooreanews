/**
 * Synchronisation des horaires ferries (cron).
 * Tente horaires-tahiti.com ; la copie locale data/ferries-schedules.json
 * sert de secours si le fetch échoue (Vercel / Cloudflare).
 */

import bundled from "../../data/ferries-schedules.json";
import {
  fetchRawFerries,
  type RawFerryData,
} from "@/lib/ferries";

export async function checkFerryScheduleSync(): Promise<{
  live: boolean;
  companies: number;
  message: string;
}> {
  const raw = await fetchRawFerries();
  const bundledCount = Object.keys(
    (bundled as RawFerryData).compagnies ?? {},
  ).length;

  if (raw) {
    const liveCount = Object.keys(raw.compagnies ?? {}).length;
    return {
      live: true,
      companies: liveCount,
      message: `${liveCount} compagnie(s) via horaires-tahiti.com (live)`,
    };
  }

  return {
    live: false,
    companies: bundledCount,
    message: `Fetch live échoué — ${bundledCount} compagnie(s) via cache local`,
  };
}
