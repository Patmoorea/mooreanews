/**
 * Annonces prioritaires pour le bandeau d’accueil (ticker).
 */

import {
  filterUpcomingMooreaVisits,
  getMooreaCruiseSchedule,
} from "@/lib/moorea-cruise-schedule";
import { getHealthOnCall } from "@/lib/health-on-call";
import { getGardeWeekendHighlight } from "@/lib/garde-weekend-public";
import { getWeeklyRecapHighlight } from "@/lib/weekly-recap-public";
import { getUtilityOutages, type UtilityOutage } from "@/lib/utility-outages";

export type HomeHighlight = {
  id: string;
  kind: "coupure_edt" | "coupure_eau" | "paquebot" | "sante_garde" | "weekly_recap";
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

  const [outages, mooreaCruises, healthOnCall, gardeHighlight, weeklyRecapHighlight] =
    await Promise.all([
    getUtilityOutages().catch(() => null),
    getMooreaCruiseSchedule().catch(() => null),
    getHealthOnCall().catch(() => null),
    getGardeWeekendHighlight().catch(() => null),
    getWeeklyRecapHighlight().catch(() => null),
  ]);

  if (weeklyRecapHighlight) {
    highlights.push({
      id: "weekly-recap-article",
      kind: "weekly_recap",
      label: weeklyRecapHighlight.label,
      href: weeklyRecapHighlight.href,
      priority: 3,
      at: new Date().toISOString(),
    });
  }

  if (gardeHighlight) {
    highlights.push({
      id: "garde-weekend-article",
      kind: "sante_garde",
      label: gardeHighlight.label,
      href: gardeHighlight.href,
      priority: 4,
      at: new Date().toISOString(),
    });
  } else if (healthOnCall?.showProminent) {
    const parts: string[] = [];
    if (healthOnCall.onDutyPharmacy) {
      parts.push(`Pharmacie : ${healthOnCall.onDutyPharmacy.name}`);
    }
    if (healthOnCall.onDutyDoctor) {
      parts.push(`Médecin : ${healthOnCall.onDutyDoctor.name}`);
    }
    const label =
      parts.length > 0
        ? parts.join(" · ")
        : "Garde Moorea — DSP 40 47 01 44";
    highlights.push({
      id: "health-on-call",
      kind: "sante_garde",
      label,
      href: "/sante-garde",
      priority: 5,
      at: new Date().toISOString(),
    });
  }

  if (outages) {
    for (const o of outages.all) {
      const start = Date.parse(o.startsAt);
      const end = Date.parse(o.endsAt);
      if (end < now || start > horizon) continue;
      highlights.push(outageHighlight(o));
    }
  }

  if (mooreaCruises) {
    for (const v of filterUpcomingMooreaVisits(mooreaCruises.visits, now)) {
      const t = Date.parse(v.visitAt);
      if (t > horizon) continue;

      const day = relativeDayLabel(v.visitAt);
      const times =
        v.timeLabel && v.timeLabel.length > 0 ? ` · ${v.timeLabel}` : "";

      highlights.push({
        id: v.id,
        kind: "paquebot",
        label: `Paquebot ${v.shipName} — Moorea ${day}${times}`,
        href: "/paquebots#moorea",
        priority: day === "demain" ? 20 : 25,
        at: v.visitAt,
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
