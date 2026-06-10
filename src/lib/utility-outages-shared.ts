/**
 * Types et formatage coupures — safe côté client (pas de fetch serveur).
 */

export type UtilityOutageKind = "coupure_edt" | "coupure_eau";

export type UtilityOutage = {
  id: string;
  kind: UtilityOutageKind;
  title: string;
  details: string | null;
  district: string | null;
  commune: string | null;
  area: string | null;
  startsAt: string;
  endsAt: string;
  sourceUrl: string;
  source: string;
};

export type UtilityOutagesResult = {
  fetchedAt: string;
  edt: UtilityOutage[];
  water: UtilityOutage[];
  all: UtilityOutage[];
};

export function formatOutageWindow(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  const start = new Date(startIso).toLocaleString("fr-FR", opts);
  const end = new Date(endIso).toLocaleString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} → ${end}`;
}

export function outageSyncFingerprint(outage: UtilityOutage): string {
  const day = new Date(outage.startsAt).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
  const place = (outage.district ?? outage.area ?? "moorea")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  return `${outage.kind}-${day}-${place}`;
}
