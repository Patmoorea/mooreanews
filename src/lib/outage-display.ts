/**
 * Affichage coupures (hero, bandeau, cartes) — partagé client / serveur.
 */

import type { UtilityOutage } from "@/lib/utility-outages-shared";

export type OutageDisplayRow = Pick<
  UtilityOutage,
  "kind" | "district" | "commune" | "startsAt" | "endsAt" | "title"
>;

function tahitiDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
}

export function relativeOutageDay(iso: string): string {
  const today = tahitiDateKey(new Date().toISOString());
  const tomorrow = tahitiDateKey(
    new Date(Date.now() + 86400000).toISOString(),
  );
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

export function outageTimeRange(startIso: string, endIso: string): string {
  const opts = {
    timeZone: "Pacific/Tahiti" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  };
  return `${new Date(startIso).toLocaleTimeString("fr-FR", opts)}–${new Date(endIso).toLocaleTimeString("fr-FR", opts)}`;
}

export function pickFeaturedOutage(
  rows: OutageDisplayRow[],
): OutageDisplayRow | null {
  const now = Date.now();
  const today = tahitiDateKey(new Date().toISOString());
  const tomorrow = tahitiDateKey(
    new Date(Date.now() + 86400000).toISOString(),
  );

  const sorted = [...rows].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );

  for (const o of sorted) {
    const end = Date.parse(o.endsAt);
    const startDay = tahitiDateKey(o.startsAt);
    if (end >= now || startDay === today || startDay === tomorrow) {
      return o;
    }
  }
  return null;
}

export function outageStickerLabel(o: OutageDisplayRow): string {
  const place = o.district ?? o.commune ?? "Moorea";
  const day = relativeOutageDay(o.startsAt);
  const times = outageTimeRange(o.startsAt, o.endsAt);
  const ended = Date.parse(o.endsAt) < Date.now();
  if (o.kind === "coupure_eau") {
    return ended
      ? `Coupure eau ${place} ${day} (terminée)`
      : `Coupure eau ${place} ${day} ${times}`;
  }
  return ended
    ? `Coupure électricité ${place} ${day} (terminée)`
    : `Coupure électricité ${place} ${day} ${times}`;
}

/** Titre court pour bandeau rouge (évite le pavé Facebook). */
export function outageBannerTitle(o: OutageDisplayRow): string {
  const place = o.district ?? o.commune ?? "Moorea";
  const day = relativeOutageDay(o.startsAt);
  const times = outageTimeRange(o.startsAt, o.endsAt);
  const kind =
    o.kind === "coupure_eau" ? "Coupure d'eau" : "Coupure d'électricité";
  return `${kind} — ${place}, ${day} ${times}`;
}

export function isOutageInProgress(o: OutageDisplayRow): boolean {
  const now = Date.now();
  return Date.parse(o.startsAt) <= now && Date.parse(o.endsAt) >= now;
}
