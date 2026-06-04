/**
 * Parsing texte → coupure EDT / eau (Te Ito Rau, PDE, articles, RSS…).
 */

import { cleanImportedText } from "@/lib/html-entities";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import type { UtilityOutage, UtilityOutageKind } from "@/lib/utility-outages";

const FRENCH_MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

export function normalizeOutageKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function tahitiIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-10:00`;
  return new Date(iso).toISOString();
}

export function detectOutageKind(text: string): UtilityOutageKind | null {
  const n = normalizeOutageKey(text);
  if (
    /coupure.*electri|panne.*electri|coupure edt|electricite|électricité|entretien de poste|entretien poste/.test(
      n,
    )
  ) {
    return "coupure_edt";
  }
  if (
    /coupure.*eau|interruption.*eau|perturbation.*eau|nettoyage reservoir|nettoyage réservoir/.test(
      n,
    )
  ) {
    return "coupure_eau";
  }
  return null;
}

export function detectOutageDistrict(text: string): string | null {
  const upper = text.toUpperCase();
  for (const d of MOOREA_DISTRICTS) {
    if (upper.includes(d.toUpperCase())) return d;
  }
  if (/TIAHURA/i.test(text)) return "Tiahura";
  if (/GENDRON/i.test(text)) return "Tiahura";
  if (/MAHAREPA/i.test(text)) return "Maharepa";
  if (/LINAREVA/i.test(text)) return "Papetoai";
  return null;
}

export function parseOutageDatesFromText(corpus: string): {
  startsAt: string;
  endsAt: string;
} | null {
  const t = cleanImportedText(corpus);

  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;

  const dmyDot = t.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  const dmySlash = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  const frDate = t.match(
    /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/i,
  );
  const headerDate = t.match(
    /\[INFO COUPURE[^[]*?(\d{2})\.(\d{2})\.(\d{4})\]/i,
  );

  if (headerDate) {
    day = Number(headerDate[1]);
    month = Number(headerDate[2]);
    year = Number(headerDate[3]);
  } else if (dmyDot) {
    day = Number(dmyDot[1]);
    month = Number(dmyDot[2]);
    year = Number(dmyDot[3]);
  } else if (dmySlash) {
    day = Number(dmySlash[1]);
    month = Number(dmySlash[2]);
    year = Number(dmySlash[3]);
  } else if (frDate) {
    day = Number(frDate[1]);
    month = FRENCH_MONTHS[normalizeOutageKey(frDate[2])] ?? null;
    year = Number(frDate[3]);
  }

  if (!day || !month || !year) return null;

  let timeM = t.match(
    /de\s+(\d{1,2})h(\d{2})\s*(?:à|a)\s+(\d{1,2})h(\d{2})/i,
  );
  if (!timeM) {
    timeM = t.match(
      /(?:heure d['']intervention|horaire)[^0-9]{0,20}(\d{1,2})h(\d{2})\s*(?:à|a|-|—)?\s*(\d{1,2})h(\d{2})/i,
    );
  }
  if (!timeM) {
    timeM = t.match(/(\d{1,2})h(\d{2})\s*(?:à|a)\s+(\d{1,2})h(\d{2})/i);
  }
  if (!timeM) {
    timeM = t.match(/(\d{1,2})h(\d{2})\s+(\d{1,2})h(\d{2})/i);
  }
  if (!timeM) return null;

  const sh = Number(timeM[1]);
  const sm = Number(timeM[2]);
  const eh = Number(timeM[3]);
  const em = Number(timeM[4]);

  const startsAt = tahitiIso(year, month, day, sh, sm);
  let endDay = day;
  let endMonth = month;
  let endYear = year;
  if (eh < sh || (eh === sh && em <= sm)) {
    const d = new Date(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-10:00`,
    );
    d.setDate(d.getDate() + 1);
    endDay = d.getDate();
    endMonth = d.getMonth() + 1;
    endYear = d.getFullYear();
  }
  const endsAt = tahitiIso(endYear, endMonth, endDay, eh, em);
  return { startsAt, endsAt };
}

export function isMooreaOutageText(corpus: string): boolean {
  const n = normalizeOutageKey(corpus);
  if (!detectOutageKind(corpus)) return false;
  return (
    n.includes("moorea") ||
    n.includes("maiao") ||
    MOOREA_DISTRICTS.some((d) => n.includes(normalizeOutageKey(d))) ||
    n.includes("tiahura") ||
    n.includes("ito rau") ||
    n.includes("te ito")
  );
}

export type OutageTextSource = {
  id: string;
  title: string;
  corpus: string;
  sourceUrl: string;
  sourceLabel: string;
};

export function outageFromText(source: OutageTextSource): UtilityOutage | null {
  const corpus = cleanImportedText(source.corpus);
  if (!isMooreaOutageText(corpus)) return null;

  const kind = detectOutageKind(corpus);
  if (!kind) return null;

  const dates = parseOutageDatesFromText(corpus);
  if (!dates) return null;

  const district = detectOutageDistrict(corpus);
  const titleClean = cleanImportedText(source.title || "Coupure programmée").slice(
    0,
    200,
  );

  return {
    id: source.id,
    kind,
    title: titleClean,
    details: corpus.slice(0, 500),
    district,
    commune: "Moorea",
    area: district,
    startsAt: dates.startsAt,
    endsAt: dates.endsAt,
    sourceUrl: source.sourceUrl,
    source: source.sourceLabel,
  };
}
