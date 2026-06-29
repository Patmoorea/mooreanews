/**
 * Coupures programmées EDT (électricité) et Polynésienne des Eaux — Moorea.
 */

import { cleanImportedText } from "@/lib/html-entities";
import type {
  UtilityOutage,
  UtilityOutagesResult,
} from "@/lib/utility-outages-shared";

export type {
  UtilityOutageKind,
  UtilityOutage,
  UtilityOutagesResult,
} from "@/lib/utility-outages-shared";
export {
  formatOutageWindow,
  outageSyncFingerprint,
} from "@/lib/utility-outages-shared";

export const EDT_OUTAGES_PAGE =
  "https://www.edt.pf/particulier/mes-infos-coupures";
export const EDT_CSV_EXPORT =
  "https://www.edt.pf/particulier/mes-infos-coupures?p_p_id=listeInfosCoupuresPortlet_WAR_EDTAEL2018&p_p_lifecycle=2&p_p_state=normal&p_p_mode=view&p_p_resource_id=/listeInfosCoupuresPortlet/home%3F0-IResourceListener-listeCoupures-exporter&p_p_cacheability=cacheLevelPage";
export const PDE_API =
  "https://www.polynesienne-des-eaux.pf/wp-json/wp/v2/posts";
export const PDE_SOURCE_LABEL = "Polynésienne des Eaux";

/** Communes EDT côté Moorea-Maiao. */
export const EDT_MOOREA_COMMUNES = new Set([
  "AFAREAITU",
  "HAAPITI",
  "PAOPAO",
  "PAPETOAI",
  "TEAVARO TEMAE",
  "MAIAO",
]);

const FETCH_HEADERS = {
  Accept: "text/html,text/csv,application/json",
  "User-Agent":
    "MooreaNews/1.0 (+https://www.mooreanews.com; utility outages sync)",
};

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

const CACHE_MS = 3 * 60 * 60 * 1000;
let cache: { at: number; data: UtilityOutagesResult } | null = null;

const FETCH_TIMEOUT_MS = 20_000;

async function withFetchTimeout<T>(promise: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), FETCH_TIMEOUT_MS);
    }),
  ]);
}

/** Invalide le cache mémoire (avant sync cron ou admin). */
export function clearUtilityOutagesCache(): void {
  cache = null;
}

function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseCookieHeader(setCookie: string | null): Map<string, string> {
  const jar = new Map<string, string>();
  if (!setCookie) return jar;
  for (const part of setCookie.split(/,(?=[^;]+?=)/)) {
    const [pair] = part.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) {
      jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  return jar;
}

function cookieString(jar: Map<string, string>): string {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function mergeCookies(jar: Map<string, string>, res: Response) {
  const raw = res.headers.get("set-cookie");
  if (!raw) return;
  for (const [k, v] of parseCookieHeader(raw)) {
    jar.set(k, v);
  }
  const getSetCookie = (
    res.headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie?.();
  if (getSetCookie) {
    for (const line of getSetCookie) {
      for (const [k, v] of parseCookieHeader(line)) {
        jar.set(k, v);
      }
    }
  }
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

function parseEdtTime(raw: string): { h: number; m: number } {
  const t = raw.trim().replace(/^0+(\d)/, "$1");
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { h: 0, m: 0 };
  return { h: Number(m[1]), m: Number(m[2]) };
}

function parseEdtDateParts(
  dateLabel: string,
  startTime: string,
  endTime: string,
): { startsAt: string; endsAt: string } | null {
  const dm = dateLabel.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dm) return null;
  const day = Number(dm[1]);
  const month = Number(dm[2]);
  const year = Number(dm[3]);
  const st = parseEdtTime(startTime);
  let en = parseEdtTime(endTime);
  if (startTime.includes("00:00:01")) {
    st.h = 0;
    st.m = 0;
  }

  const startsAt = tahitiIso(year, month, day, st.h, st.m);
  let endDay = day;
  let endMonth = month;
  let endYear = year;
  if (en.h < st.h || (en.h === st.h && en.m <= st.m)) {
    const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-10:00`);
    d.setDate(d.getDate() + 1);
    endDay = d.getDate();
    endMonth = d.getMonth() + 1;
    endYear = d.getFullYear();
  }
  const endsAt = tahitiIso(endYear, endMonth, endDay, en.h, en.m);
  return { startsAt, endsAt };
}

function edtDistrict(commune: string, quartier: string): string | null {
  const q = normalizeKey(quartier);
  const map: [string, string][] = [
    ["maharepa", "Maharepa"],
    ["afareaitu", "Afareaitu"],
    ["paopao", "Paopao"],
    ["papetoai", "Papetoai"],
    ["haapiti", "Haapiti"],
    ["temae", "Temae"],
    ["teavaro", "Teavaro"],
    ["vaiare", "Vaiare"],
    ["tiahura", "Tiahura"],
    ["atiha", "Maatea"],
  ];
  for (const [needle, district] of map) {
    if (q.includes(needle)) return district;
  }
  const c = commune.toUpperCase();
  if (c === "AFAREAITU") return "Afareaitu";
  if (c === "HAAPITI") return "Haapiti";
  if (c === "PAOPAO") return "Paopao";
  if (c === "PAPETOAI") return "Papetoai";
  if (c === "TEAVARO TEMAE") return "Teavaro";
  return null;
}

function parseCsvLine(line: string): string[] {
  const parts = line.split(",");
  if (parts.length <= 6) return parts.map((p) => p.trim());
  return [
    parts[0].trim(),
    parts[1].trim(),
    parts[2].trim(),
    parts[3].trim(),
    parts[4].trim(),
    parts.slice(5).join(",").trim(),
  ];
}

function parseEdtCsv(csv: string): UtilityOutage[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines[0]?.startsWith("sep=")) lines.shift();
  if (lines.length < 2) return [];

  const outages: UtilityOutage[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 5) continue;
    const commune = cols[3]?.trim().toUpperCase() ?? "";
    if (!EDT_MOOREA_COMMUNES.has(commune)) continue;

    const dates = parseEdtDateParts(cols[0], cols[1], cols[2]);
    if (!dates) continue;

    const quartier = cols[4]?.trim() ?? "";
    const work = cols[5]?.trim() || null;
    const district = edtDistrict(commune, quartier);
    const communeLabel = commune.replace("TEAVARO TEMAE", "Teavaro-Temae");
    const title = `Coupure EDT ${communeLabel} — ${cols[0]} ${cols[1]}–${cols[2]}`;
    const id = `edt:${cols[0]}:${cols[1]}:${commune}:${normalizeKey(quartier).slice(0, 40)}`;

    outages.push({
      id,
      kind: "coupure_edt",
      title,
      details: work ? `${quartier}. ${work}`.slice(0, 500) : quartier.slice(0, 500) || null,
      district,
      commune: communeLabel,
      area: quartier || null,
      startsAt: dates.startsAt,
      endsAt: dates.endsAt,
      sourceUrl: EDT_OUTAGES_PAGE,
      source: "EDT Engie",
    });
  }
  return outages;
}

async function fetchEdtCsv(): Promise<string> {
  const jar = new Map<string, string>();
  const pageRes = await fetch(EDT_OUTAGES_PAGE, {
    headers: FETCH_HEADERS,
    cache: "no-store",
  });
  mergeCookies(jar, pageRes);
  await pageRes.text();

  const exportRes = await fetch(EDT_CSV_EXPORT, {
    headers: { ...FETCH_HEADERS, Cookie: cookieString(jar) },
    cache: "no-store",
  });
  if (!exportRes.ok) {
    throw new Error(`EDT export HTTP ${exportRes.status}`);
  }
  const text = new TextDecoder("latin1").decode(await exportRes.arrayBuffer());
  if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
    throw new Error("EDT export indisponible (session)");
  }
  return text;
}

type WpPost = {
  id: number;
  link: string;
  date: string;
  title: { rendered: string };
};

function parsePdeTitle(title: string): {
  startsAt: string;
  endsAt: string;
  area: string;
} | null {
  const t = cleanImportedText(title);
  const dateM = t.match(
    /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(\d{4})/i,
  );
  const timeM = t.match(
    /de\s+(\d{1,2})h(\d{2})\s*(?:à|a)\s+(\d{1,2})h(\d{2})/i,
  );
  if (!dateM || !timeM) return null;

  const month = FRENCH_MONTHS[normalizeKey(dateM[2])];
  if (!month) return null;
  const day = Number(dateM[1]);
  const year = Number(dateM[3]);
  const sh = Number(timeM[1]);
  const sm = Number(timeM[2]);
  const eh = Number(timeM[3]);
  const em = Number(timeM[4]);

  const startsAt = tahitiIso(year, month, day, sh, sm);
  let endDay = day;
  let endMonth = month;
  let endYear = year;
  if (eh < sh || (eh === sh && em <= sm)) {
    const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00-10:00`);
    d.setDate(d.getDate() + 1);
    endDay = d.getDate();
    endMonth = d.getMonth() + 1;
    endYear = d.getFullYear();
  }
  const endsAt = tahitiIso(endYear, endMonth, endDay, eh, em);

  const area = t
    .replace(/^MOOREA\s*[–-]\s*/i, "")
    .replace(/coupures?\s+d['']eau\s*/i, "")
    .replace(/le\s+\w+\s+\d{1,2}\s+\w+\s+\d{4}\s*/i, "")
    .replace(/de\s+\d{1,2}h\d{2}\s*(?:à|a)\s+\d{1,2}h\d{2}\s*$/i, "")
    .trim();

  return { startsAt, endsAt, area: area || t };
}

function pdeDistrict(title: string, area: string): string | null {
  const corpus = normalizeKey(`${title} ${area}`);
  const map: [string, string][] = [
    ["maharepa", "Maharepa"],
    ["afareaitu", "Afareaitu"],
    ["paopao", "Paopao"],
    ["papetoai", "Papetoai"],
    ["haapiti", "Haapiti"],
    ["temae", "Temae"],
    ["teavaro", "Teavaro"],
    ["vaiare", "Vaiare"],
    ["atiha", "Maatea"],
    ["tiahura", "Tiahura"],
  ];
  for (const [needle, district] of map) {
    if (corpus.includes(needle)) return district;
  }
  return null;
}

function isMooreaWaterPost(title: string): boolean {
  const t = normalizeKey(cleanImportedText(title));
  if (!t.includes("coupure") && !t.includes("perturbation") && !t.includes("casse sur le reseau")) {
    return false;
  }
  if (t.startsWith("moorea")) return true;
  return /maharepa|afareaitu|paopao|papetoai|haapiti|temae|teavaro|vaiare|atiha/.test(t);
}

async function fetchPdeMooreaOutages(): Promise<UtilityOutage[]> {
  const searches = ["moorea coupure", "moorea eau", "MOOREA –"];
  const seen = new Set<number>();
  const allPosts: WpPost[] = [];

  for (const q of searches) {
    const url = `${PDE_API}?search=${encodeURIComponent(q)}&per_page=25&_fields=id,title,link,date`;
    const res = await fetch(url, { headers: FETCH_HEADERS, cache: "no-store" });
    if (!res.ok) continue;
    const posts = (await res.json()) as WpPost[];
    for (const post of posts) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      allPosts.push(post);
    }
  }

  if (allPosts.length === 0) {
    throw new Error("PDE API: aucun résultat");
  }

  const horizon = Date.now() + 120 * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const outages: UtilityOutage[] = [];

  for (const post of allPosts) {
    const rawTitle = post.title.rendered;
    if (!isMooreaWaterPost(rawTitle)) continue;

    const parsed = parsePdeTitle(rawTitle);
    if (!parsed) continue;

    const endMs = Date.parse(parsed.endsAt);
    const startMs = Date.parse(parsed.startsAt);
    if (endMs < cutoff || startMs > horizon) continue;

    const title = cleanImportedText(rawTitle).slice(0, 200);
    const district = pdeDistrict(title, parsed.area);

    outages.push({
      id: `pde:${post.id}`,
      kind: "coupure_eau",
      title,
      details: parsed.area.slice(0, 500) || null,
      district,
      commune: "Moorea",
      area: parsed.area || null,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt,
      sourceUrl: post.link,
      source: PDE_SOURCE_LABEL,
    });
  }

  return outages.sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );
}

export async function getUtilityOutages(): Promise<UtilityOutagesResult> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const [
    { fetchOutagesFromArticles },
    { fetchOutagesFromLiveVeille },
    {
      extraTeItoRauPostUrlsFromEnv,
      fetchOutagesFromExtraFacebookUrls,
      fetchOutagesFromFacebookFeeds,
    },
  ] = await Promise.all([
    import("@/lib/outage-article-import"),
    import("@/lib/outage-external-import"),
    import("@/lib/outage-facebook-feed"),
  ]);

  const [
    edtRaw,
    water,
    fromArticles,
    fromLiveVeille,
    fbFeed,
    fromExtraFb,
  ] = await Promise.all([
    withFetchTimeout(fetchEdtCsv().catch(() => ""), ""),
    withFetchTimeout(fetchPdeMooreaOutages().catch(() => [] as UtilityOutage[]), []),
    withFetchTimeout(fetchOutagesFromArticles().catch(() => [] as UtilityOutage[]), []),
    withFetchTimeout(fetchOutagesFromLiveVeille().catch(() => [] as UtilityOutage[]), []),
    withFetchTimeout(
      fetchOutagesFromFacebookFeeds().catch(() => ({
        outages: [] as UtilityOutage[],
        errors: [] as string[],
        postsImported: 0,
      })),
      { outages: [], errors: [], postsImported: 0 },
    ),
    withFetchTimeout(
      fetchOutagesFromExtraFacebookUrls(extraTeItoRauPostUrlsFromEnv()).catch(
        () => [] as UtilityOutage[],
      ),
      [],
    ),
  ]);

  const edt = edtRaw ? parseEdtCsv(edtRaw) : [];
  const fbOutages = fbFeed.outages;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  const mergeUnique = (rows: UtilityOutage[]) => {
    const map = new Map<string, UtilityOutage>();
    for (const o of rows) {
      const key = `${o.kind}-${o.startsAt.slice(0, 10)}-${normalizeKey(o.district ?? o.area ?? "")}`;
      if (!map.has(key)) map.set(key, o);
    }
    return [...map.values()];
  };

  const upcoming = (rows: UtilityOutage[]) =>
    mergeUnique(rows)
      .filter((o) => Date.parse(o.endsAt) >= cutoff)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));

  const supplementalEdt = [
    ...fromArticles,
    ...fromLiveVeille,
    ...fbOutages,
    ...fromExtraFb,
  ].filter((o) => o.kind === "coupure_edt");

  const supplementalWater = [
    ...fromArticles,
    ...fromLiveVeille,
    ...fbOutages,
    ...fromExtraFb,
  ].filter((o) => o.kind === "coupure_eau");

  const edtUp = upcoming([...edt, ...supplementalEdt]);
  const waterUp = upcoming([...water, ...supplementalWater]);

  const data: UtilityOutagesResult = {
    fetchedAt: new Date().toISOString(),
    edt: edtUp,
    water: waterUp,
    all: [...edtUp, ...waterUp].sort(
      (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
    ),
  };

  cache = { at: Date.now(), data };
  return data;
}
