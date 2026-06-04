/**
 * Escales paquebots — prévisions officielles Port autonome de Papeete.
 * Source : https://www.portdepapeete.pf/prevision-des-bateaux/previsions/
 */

const PORT_SCHEDULE_URL =
  "https://www.portdepapeete.pf/prevision-des-bateaux/previsions/";

export const CRUISE_SOURCE_URL = PORT_SCHEDULE_URL;
export const CRUISE_SOURCE_LABEL = "Port autonome de Papeete";

export type CruiseShipCall = {
  id: string;
  movementAt: string;
  movementLabel: string;
  shipName: string;
  callNumber: string;
  arrival: string | null;
  departure: string | null;
  port: string;
  quay: string;
  berth: string;
  voyageNumber: string | null;
  agent: string;
  lengthM: number | null;
  /** Papeete = port d’accueil principal (excursions vers Moorea). */
  gatewayForMoorea: boolean;
};

export type CruiseScheduleResult = {
  fetchedAt: string;
  source: string;
  sourceUrl: string;
  papeete: CruiseShipCall[];
  otherPorts: CruiseShipCall[];
  all: CruiseShipCall[];
  updatedLabel: string | null;
};

function stripHtml(raw: string): string {
  return raw
   .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dataOrderFromCell(cellHtml: string): number | null {
  const m = cellHtml.match(/data-order=["'](\d+)["']/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseRow(cellsHtml: string[]): CruiseShipCall | null {
  if (cellsHtml.length < 13) return null;

  const texts = cellsHtml.map(stripHtml);
  const type = texts[3]?.toUpperCase() ?? "";
  if (!type.includes("PAQUEBOT")) return null;

  const order = dataOrderFromCell(cellsHtml[0] ?? "");
  const movementLabel = texts[0] || texts[4] || texts[5];
  if (!movementLabel) return null;

  const movementAt =
    order != null
      ? new Date(order * 1000).toISOString()
      : parseFrenchDateTime(movementLabel);

  if (!movementAt) return null;

  const port = texts[6]?.toUpperCase() || "PAPEETE";
  const lengthRaw = texts[12]?.replace(",", ".");
  const lengthM = lengthRaw ? Number.parseFloat(lengthRaw) : null;

  return {
    id: `${texts[2]?.replace(/\s+/g, "")}-${order ?? movementLabel}`,
    movementAt,
    movementLabel,
    shipName: texts[1] ?? "Navire",
    callNumber: texts[2] ?? "",
    arrival: texts[4] || null,
    departure: texts[5] || null,
    port,
    quay: texts[7] ?? "",
    berth: texts[8] ?? "",
    voyageNumber: texts[9] || null,
    agent: texts[10] ?? "",
    lengthM: Number.isFinite(lengthM!) ? lengthM : null,
    gatewayForMoorea: port === "PAPEETE",
  };
}

/** DD/MM/YYYY HH:mm en heure Tahiti (UTC−10). */
function parseFrenchDateTime(label: string): string | null {
  const m = label.match(
    /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/,
  );
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00-10:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function parseScheduleHtml(html: string): CruiseShipCall[] {
  const tbodyStart = html.indexOf("<tbody>");
  const tbodyEnd = html.indexOf("</tbody>", tbodyStart);
  if (tbodyStart < 0 || tbodyEnd < 0) return [];

  const tbody = html.slice(tbodyStart, tbodyEnd);
  const rowMatches = tbody.matchAll(/<tr>([\s\S]*?)<\/tr>/gi);
  const calls: CruiseShipCall[] = [];

  for (const row of rowMatches) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (c) => c[1],
    );
    const call = parseRow(cells);
    if (call) calls.push(call);
  }

  return calls;
}

function extractUpdatedLabel(html: string): string | null {
  const m = html.match(
    /Informations mises à jour le\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i,
  );
  return m?.[1] ?? null;
}

const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { at: number; data: CruiseScheduleResult } | null = null;

export async function getCruiseShipSchedule(): Promise<CruiseScheduleResult> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const res = await fetch(PORT_SCHEDULE_URL, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "MooreaNews/1.0 (+https://www.mooreanews.com; cruise schedule widget)",
    },
    cache: "no-store",
    next: { revalidate: 21600 },
  });

  if (!res.ok) {
    throw new Error(`Port Papeete HTTP ${res.status}`);
  }

  const html = await res.text();
  const allRaw = parseScheduleHtml(html);

  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  const horizon = Date.now() + 120 * 24 * 60 * 60 * 1000;

  const upcoming = allRaw
    .filter((c) => {
      const t = Date.parse(c.movementAt);
      return t >= cutoff && t <= horizon;
    })
    .sort((a, b) => Date.parse(a.movementAt) - Date.parse(b.movementAt));

  const papeete = upcoming.filter((c) => c.port === "PAPEETE");
  const otherPorts = upcoming.filter((c) => c.port !== "PAPEETE");

  const data: CruiseScheduleResult = {
    fetchedAt: new Date().toISOString(),
    source: CRUISE_SOURCE_LABEL,
    sourceUrl: CRUISE_SOURCE_URL,
    papeete,
    otherPorts,
    all: upcoming,
    updatedLabel: extractUpdatedLabel(html),
  };

  cache = { at: Date.now(), data };
  return data;
}

/** Libellé port pour l’affichage (données source en majuscules). */
export function formatCruisePort(port: string): string {
  const p = port.toUpperCase();
  if (p === "PAPEETE") return "Papeete (Tahiti)";
  if (p === "UTUROA") return "Uturoa (Raiatea)";
  return port;
}

/** Moorea n’apparaît pas dans le calendrier « PAQUEBOT » du Port de Papeete. */
export const CRUISE_MOOREA_NOTICE =
  "Les très gros paquebots de croisière n’accostent pas à Moorea : pas de quai profond dédié. Les passagers vont souvent à Moorea en excursion depuis Papeete (ferry ou organisateur). Les escales « paquebot » listées ici sont Papeete et Uturoa (Raiatea).";

export function formatCruiseDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
