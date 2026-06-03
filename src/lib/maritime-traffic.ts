/**
 * Statistiques trafic maritime DPAM + tourisme ISPF (données annuelles).
 * Mise à jour : data/maritime-traffic.json (+ vérif PDF DPAM via cron).
 */

import bundled from "../../data/maritime-traffic.json";

export const DPAM_STATS_PAGE =
  "https://www.service-public.pf/dpam/statistiques-maritimes-interinsulaires/";
export const DPAM_MEDIA_API =
  "https://www.service-public.pf/dpam/wp-json/wp/v2/media?search=Statistiques&per_page=30&_fields=id,title,source_url,date";

export type VesselTraffic = {
  name: string;
  passengers: number;
  outbound?: number;
  inbound?: number;
};

export type YearMooreaTraffic = {
  totalPassengers: number;
  mooreaMaiao?: number;
  maiaoOnly?: number;
  vessels: VesselTraffic[];
};

export type YearTourism = {
  tourists: number;
  cruisePassengers: number;
  landTourists?: number;
  visitors?: number;
};

export type MaritimeTrafficData = {
  updatedAt: string;
  sources: {
    dpam: { label: string; page: string; pdfs: Record<string, string> };
    ispfTourism: { label: string; page: string };
  };
  mooreaLine: {
    label: string;
    note: string;
    years: Record<string, YearMooreaTraffic>;
  };
  polynesiaMaritime: {
    label: string;
    note: string;
    years: Record<
      string,
      {
        totalPassengers: number;
        archipelagos?: Record<string, number>;
      }
    >;
  };
  tourism: {
    label: string;
    note: string;
    years: Record<string, YearTourism>;
  };
};

export type DpamFreshnessCheck = {
  latestPdfYear: number | null;
  latestPdfUrl: string | null;
  dataYears: number[];
  needsUpdate: boolean;
  message: string;
};

const DATA = bundled as MaritimeTrafficData;

export function getMaritimeTrafficData(): MaritimeTrafficData {
  return DATA;
}

/** Années disponibles (tri décroissant — dernière année en premier). */
export function getTrafficYears(): number[] {
  return Object.keys(DATA.mooreaLine.years)
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

/** Années pour affichage tableaux : ancien → récent (ex. 2024, 2025). */
export function getDisplayYears(limit = 2): number[] {
  return getTrafficYears()
    .slice(0, limit)
    .sort((a, b) => a - b);
}

/** Deux dernières années avec données Moorea. */
export function getLatestMooreaComparison(): {
  current: { year: number; data: YearMooreaTraffic };
  previous: { year: number; data: YearMooreaTraffic } | null;
} {
  const years = getTrafficYears();
  const currentYear = years[0];
  const prevYear = years[1] ?? null;
  return {
    current: {
      year: currentYear,
      data: DATA.mooreaLine.years[String(currentYear)],
    },
    previous: prevYear
      ? { year: prevYear, data: DATA.mooreaLine.years[String(prevYear)] }
      : null,
  };
}

export function formatTrafficNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export function formatPercentChange(current: number, previous: number): string {
  const pct = percentChange(current, previous);
  if (pct == null) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1).replace(".", ",")} %`;
}

/** Détecte un PDF « Statistiques-YYYY » plus récent que le JSON local. */
export async function checkDpamStatsFreshness(): Promise<DpamFreshnessCheck> {
  const dataYears = getTrafficYears();
  const maxDataYear = dataYears[0] ?? 0;

  try {
    const res = await fetch(DPAM_MEDIA_API, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MooreaNews/1.0 (+https://www.mooreanews.com)",
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`DPAM media HTTP ${res.status}`);

    const items = (await res.json()) as {
      source_url?: string;
      title?: { rendered?: string };
    }[];

    let latestPdfYear = 0;
    let latestPdfUrl: string | null = null;

    for (const item of items) {
      const url = item.source_url ?? "";
      const m =
        url.match(/Statistiques-(\d{4})\.pdf/i) ??
        item.title?.rendered?.match(/Statistiques\s+(\d{4})/i);
      if (!m) continue;
      const y = Number(m[1]);
      if (y > latestPdfYear) {
        latestPdfYear = y;
        latestPdfUrl = url;
      }
    }

    if (!latestPdfYear) {
      return {
        latestPdfYear: null,
        latestPdfUrl: null,
        dataYears,
        needsUpdate: false,
        message: "Aucun PDF DPAM détecté",
      };
    }

    const needsUpdate = latestPdfYear > maxDataYear;
    return {
      latestPdfYear,
      latestPdfUrl,
      dataYears,
      needsUpdate,
      message: needsUpdate
        ? `PDF ${latestPdfYear} publié — mettre à jour data/maritime-traffic.json`
        : `Données à jour (PDF ${latestPdfYear})`,
    };
  } catch (e) {
    return {
      latestPdfYear: null,
      latestPdfUrl: null,
      dataYears,
      needsUpdate: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
