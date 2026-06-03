/**
 * Annonces prioritaires pour le bandeau d’accueil (ticker).
 */

import { getCruiseShipSchedule } from "@/lib/cruise-ships";
import { getUtilityOutages, type UtilityOutage } from "@/lib/utility-outages";

export type HomeHighlight = {
  id: string;
  kind: "coupure_edt" | "coupure_eau" | "paquebot";
  label: string;
  href: string;
  priority: number;
  at: string;
};

const HORIZON_MS = 7 * 24 * 60 * 60 * 1000;

function tahitiDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return d.toLocaleDateString("en-CA", { timeZone: "Pacific/Tahiti" });
}

function relativeDayLabel(iso: string): string {
  const now = new Date();
  const today = tahitiDateKey(now);
  const tomorrow = tahitiDateKey(new Date(now.getTime() + 86400000));
  const key = tahitiDateKey(iso);
  if (key === today) return "aujourd'hui";
  if (key === tomorrow) return "demain";
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso).toLocaleTimeString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(endIso).toLocaleTimeString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start}–${end}`;
}

function outageHighlight(o: UtilityOutage): HomeHighlight {
  const day = relativeDayLabel(o.startsAt);
  const place = o.district ?? o.commune ?? "Moorea";
  const times = formatTimeRange(o.startsAt, o.endsAt);
  const isEdt = o.kind === "coupure_edt";

  return {
    id: o.id,
    kind: o.kind,
    label: isEdt
      ? `Coupure électricité ${place} ${day} ${times}`
      : `Coupure d'eau ${place} ${day} ${times}`,
    href: "/coupures",
    priority: isEdt ? 10 : 11,
    at: o.startsAt,
  };
}

export async function getHomeHighlights(): Promise<HomeHighlight[]> {
  const now = Date.now();
  const horizon = now + HORIZON_MS;
  const highlights: HomeHighlight[] = [];

  const [outages, cruises] = await Promise.all([
    getUtilityOutages().catch(() => null),
    getCruiseShipSchedule().catch(() => null),
  ]);

  if (outages) {
    for (const o of outages.all) {
      const start = Date.parse(o.startsAt);
      const end = Date.parse(o.endsAt);
      if (end < now || start > horizon) continue;
      highlights.push(outageHighlight(o));
    }
  }

  if (cruises) {
    const byShipDay = new Map<string, (typeof cruises.papeete)[number]>();
    for (const c of cruises.papeete) {
      const t = Date.parse(c.movementAt);
      if (t < now - 6 * 60 * 60 * 1000 || t > horizon) continue;
      const key = `${c.shipName.toUpperCase()}-${tahitiDateKey(c.movementAt)}`;
      const prev = byShipDay.get(key);
      if (!prev || (c.arrival && !prev.arrival)) {
        byShipDay.set(key, c);
      }
    }

    for (const c of byShipDay.values()) {
      const day = relativeDayLabel(c.movementAt);
      const arr = c.arrival ? ` · ${c.arrival.replace(/\s+/g, " ").trim()}` : "";

      highlights.push({
        id: c.id,
        kind: "paquebot",
        label: `Paquebot ${c.shipName} à Papeete ${day}${arr} — excursions Moorea`,
        href: "/paquebots",
        priority: day === "demain" ? 20 : 25,
        at: c.movementAt,
      });
    }
  }

  return highlights
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return Date.parse(a.at) - Date.parse(b.at);
    })
    .slice(0, 8);
}
