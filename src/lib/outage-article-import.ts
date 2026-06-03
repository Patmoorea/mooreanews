/**
 * Coupures détectées dans les actualités MooreaNews (Facebook, commune, etc.).
 * Complète les sources officielles EDT / Polynésienne des Eaux.
 */

import { cleanImportedText } from "@/lib/html-entities";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import { getAdminSupabase } from "@/lib/supabase/admin";
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

function normalizeKey(s: string): string {
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

function detectKind(text: string): UtilityOutageKind | null {
  const n = normalizeKey(text);
  if (
    /coupure.*electri|panne.*electri|coupure edt|electricite|électricité/.test(
      n,
    )
  ) {
    return "coupure_edt";
  }
  if (/coupure.*eau|interruption.*eau|perturbation.*eau/.test(n)) {
    return "coupure_eau";
  }
  return null;
}

function detectDistrict(text: string): string | null {
  const upper = text.toUpperCase();
  for (const d of MOOREA_DISTRICTS) {
    if (upper.includes(d.toUpperCase())) return d;
  }
  if (/TIAHURA/i.test(text)) return "Tiahura";
  return null;
}

function parseOutageFromText(corpus: string): {
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

  if (dmyDot) {
    day = Number(dmyDot[1]);
    month = Number(dmyDot[2]);
    year = Number(dmyDot[3]);
  } else if (dmySlash) {
    day = Number(dmySlash[1]);
    month = Number(dmySlash[2]);
    year = Number(dmySlash[3]);
  } else if (frDate) {
    day = Number(frDate[1]);
    month = FRENCH_MONTHS[normalizeKey(frDate[2])] ?? null;
    year = Number(frDate[3]);
  }

  if (!day || !month || !year) return null;

  const timeM = t.match(
    /de\s+(\d{1,2})h(\d{2})\s*(?:à|a)\s+(\d{1,2})h(\d{2})/i,
  );
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

function isMooreaOutageArticle(corpus: string): boolean {
  const n = normalizeKey(corpus);
  if (!detectKind(corpus)) return false;
  return (
    n.includes("moorea") ||
    n.includes("maiao") ||
    MOOREA_DISTRICTS.some((d) => n.includes(normalizeKey(d))) ||
    n.includes("tiahura") ||
    n.includes("ito rau")
  );
}

export async function fetchOutagesFromArticles(): Promise<UtilityOutage[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("articles")
    .select("slug, title, excerpt, body, published_at")
    .eq("published", true)
    .gte("published_at", since)
    .or(
      "title.ilike.%coupure%,title.ilike.%électricité%,title.ilike.%electricite%,title.ilike.%eau potable%,excerpt.ilike.%coupure%",
    )
    .order("published_at", { ascending: false })
    .limit(30);

  if (!data?.length) return [];

  const outages: UtilityOutage[] = [];

  for (const row of data) {
    const corpus = cleanImportedText(
      `${row.title ?? ""} ${row.excerpt ?? ""} ${row.body ?? ""}`,
    );
    if (!isMooreaOutageArticle(corpus)) continue;

    const kind = detectKind(corpus);
    if (!kind) continue;

    const dates = parseOutageFromText(corpus);
    if (!dates) continue;

    const district = detectDistrict(corpus);
    const titleClean = cleanImportedText(row.title ?? "Coupure programmée").slice(
      0,
      200,
    );

    outages.push({
      id: `article:${row.slug}`,
      kind,
      title: titleClean,
      details: corpus.slice(0, 500),
      district,
      commune: "Moorea",
      area: district,
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      sourceUrl: `/actualites/${row.slug}`,
      source: "MooreaNews — actualités",
    });
  }

  return outages;
}
