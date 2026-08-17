/**
 * Veille web agenda Moorea — découverte d’événements / activités.
 * Tourne en fin de semaine pour remplir la semaine suivante.
 */

import {
  eventCategoryFromMessage,
  parseDistrictFromMessage,
} from "@/lib/facebook-post-parse";
import { decodeHtmlEntities } from "@/lib/html-entities";
import { MOOREA_KEYWORDS } from "@/lib/rss-sources";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getNextWeekRange } from "@/lib/week-ahead-range";
import {
  CRUISE_STOP_SEEDS,
  DELUXE_CRUISES_STAR_BREEZE_YEAR,
  FENUA_AGENDA_EVENT_BASE,
  FENUA_AGENDA_MOOREA_LIST,
  MARCHE_BIO,
  MOOREA_WEB_SEARCH_QUERIES,
  TAHITI_TOURISME_LISTING_URLS,
  TAHITI_TOURISME_MOOREA_SEEDS,
  TOUR_OPERATOR_WATCH_URLS,
} from "@/lib/web-event-sources";

export type DiscoveredEvent = {
  sourceId: string;
  externalId: string;
  title: string;
  description: string;
  category: string;
  date: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  district?: string | null;
  organizer?: string | null;
  url: string;
  coverUrl?: string | null;
  price?: string | null;
};

export type WebEventDiscoveryResult = {
  ok: boolean;
  weekLabel: string;
  rangeStart: string;
  rangeEnd: string;
  discovered: number;
  inserted: number;
  updated: number;
  skipped: number;
  bySource: Record<string, number>;
  titles: string[];
  errors: string[];
};

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const MONTHS: Record<string, number> = {
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

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function tahitiTodayIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

/** Fenêtre : aujourd’hui → fin de la semaine suivante (+ marge 6 semaines pour l’agenda). */
export function getDiscoveryDateWindow(now = new Date()): {
  start: string;
  end: string;
  week: ReturnType<typeof getNextWeekRange>;
} {
  const today = tahitiTodayIso(now);
  const week = getNextWeekRange(now);
  const end = maxIso(week.end, addDaysIso(today, 42));
  return { start: today, end, week };
}

function webEventsPublishedByDefault(): boolean {
  const raw = process.env.WEB_EVENTS_PUBLISHED?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}

function normalizeText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function mentionsMoorea(text: string): boolean {
  const n = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return MOOREA_KEYWORDS.some((k) =>
    n.includes(
      k
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    ),
  );
}

function frenchDateToIso(day: number, monthName: string, year: number): string | null {
  const month =
    MONTHS[monthName.toLowerCase()] ??
    MONTHS[
      monthName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
    ];
  if (!month || day < 1 || day > 31) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function parseFrenchLongDate(text: string): string | null {
  const m = text.match(
    /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})/i,
  );
  if (!m) return null;
  return frenchDateToIso(Number(m[1]), m[2], Number(m[3]));
}

function parseFrenchTime(text: string): string | null {
  const m = text.match(/\b(\d{1,2})\s*h\s*(\d{2})?\b/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return `${pad2(h)}:${pad2(min)}:00`;
}

function toTimeDb(hhmm: string | null | undefined): string | null {
  if (!hhmm) return null;
  const t = hhmm.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  return parseFrenchTime(t);
}

function marker(sourceId: string, externalId: string): string {
  return `<!-- web-discover:${sourceId}:${externalId} -->`;
}

function canonicalEventUrl(sourceUrl: string, dateIso: string): string {
  try {
    const u = new URL(sourceUrl);
    u.hash = `date=${dateIso}`;
    return u.toString();
  } catch {
    return `${sourceUrl}#date=${dateIso}`;
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

type JsonLdEvent = {
  name?: string;
  description?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  image?: string | string[];
  location?:
    | string
    | {
        name?: string;
        address?:
          | string
          | {
              streetAddress?: string;
              addressLocality?: string;
            };
      };
};

function collectJsonLdEvents(html: string): JsonLdEvent[] {
  const out: JsonLdEvent[] = [];
  const re =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const raw = m[1].trim();
      if (!raw) continue;
      const data = JSON.parse(raw) as unknown;
      const stack: unknown[] = [data];
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== "object") continue;
        if (Array.isArray(cur)) {
          stack.push(...cur);
          continue;
        }
        const obj = cur as Record<string, unknown>;
        if (obj["@graph"]) stack.push(obj["@graph"]);
        const type = obj["@type"];
        const types = Array.isArray(type) ? type : type ? [type] : [];
        if (types.map(String).some((t) => t.toLowerCase() === "event")) {
          out.push(obj as JsonLdEvent);
        }
      }
    } catch {
      /* ignore bad JSON-LD */
    }
  }
  return out;
}

function locationFromJsonLd(ev: JsonLdEvent): string {
  const loc = ev.location;
  if (!loc) return "Moorea";
  if (typeof loc === "string") return loc.slice(0, 120) || "Moorea";
  const parts: string[] = [];
  if (loc.name && loc.name !== "Adresse") parts.push(loc.name);
  const addr = loc.address;
  if (typeof addr === "string") parts.push(addr);
  else if (addr) {
    if (addr.streetAddress) parts.push(addr.streetAddress);
    if (addr.addressLocality) parts.push(addr.addressLocality);
  }
  const joined = parts.join(", ").replace(/\s+/g, " ").trim();
  return joined || "Moorea";
}

function imageFromJsonLd(ev: JsonLdEvent): string | null {
  if (!ev.image) return null;
  if (typeof ev.image === "string") return ev.image;
  return ev.image[0] ?? null;
}

function extractOccurrenceDates(html: string, start: string, end: string): string[] {
  const dates = new Set<string>();
  for (const m of html.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
    const iso = `${m[1]}-${m[2]}-${m[3]}`;
    if (iso >= start && iso <= end) dates.add(iso);
  }
  for (const m of html.matchAll(
    /\bLe\s+(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d{2})\b/gi,
  )) {
    const iso = frenchDateToIso(Number(m[1]), m[2], Number(m[3]));
    if (iso && iso >= start && iso <= end) dates.add(iso);
  }
  return [...dates].sort();
}

function firstSaturdayOfMonth(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  while (d.getUTCDay() !== 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

function discoverRecurringMarcheBio(
  rangeStart: string,
  rangeEnd: string,
): DiscoveredEvent[] {
  const out: DiscoveredEvent[] = [];
  const startY = Number(rangeStart.slice(0, 4));
  const startM = Number(rangeStart.slice(5, 7));
  for (let i = 0; i < 6; i++) {
    const monthIndex = startM - 1 + i;
    const year = startY + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    const date = firstSaturdayOfMonth(year, month);
    if (date < rangeStart || date > rangeEnd) continue;
    out.push({
      sourceId: "recurring",
      externalId: `${MARCHE_BIO.id}-${date}`,
      title: MARCHE_BIO.title,
      description: `${MARCHE_BIO.description}\n\n${marker("recurring", `${MARCHE_BIO.id}-${date}`)}`,
      category: "marche",
      date,
      startTime: toTimeDb(MARCHE_BIO.startTime),
      endTime: toTimeDb(MARCHE_BIO.endTime),
      location: MARCHE_BIO.location,
      district: MARCHE_BIO.district,
      organizer: MARCHE_BIO.organizer,
      url: canonicalEventUrl(MARCHE_BIO.url, date),
    });
  }
  return out;
}

function discoverCruiseSeeds(
  rangeStart: string,
  rangeEnd: string,
): DiscoveredEvent[] {
  return CRUISE_STOP_SEEDS.filter(
    (c) => c.date >= rangeStart && c.date <= rangeEnd,
  ).map((c) => ({
    sourceId: "cruise-seed",
    externalId: c.id,
    title: c.title,
    description: `${c.description}\n\n${marker("cruise-seed", c.id)}`,
    category: c.category ?? "autre",
    date: c.date,
    endDate: c.endDate ?? null,
    startTime: toTimeDb(c.startTime),
    endTime: toTimeDb(c.endTime),
    location: c.location,
    district: c.district ?? null,
    organizer: c.organizer ?? null,
    url: canonicalEventUrl(c.url, c.date),
  }));
}

const EN_MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

function englishDateToIso(day: number, monthName: string, year: number): string | null {
  const month = EN_MONTHS[monthName.toLowerCase()];
  if (!month || day < 1 || day > 31) return null;
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Escales Moorea du MS Star Breeze (itinéraires publics).
 * C’est ce qui manquait pour le peloton vélo : l’info n’est pas sur Fenua Agenda,
 * elle est sur les croisières / opérateurs étrangers.
 */
async function discoverWindstarMooreaPortDays(
  rangeStart: string,
  rangeEnd: string,
  errors: string[],
): Promise<DiscoveredEvent[]> {
  const listHtml = await fetchHtml(DELUXE_CRUISES_STAR_BREEZE_YEAR);
  if (!listHtml) {
    errors.push("windstar-ports: listing Deluxe Cruises inaccessible");
    return [];
  }

  const relLinks = [
    ...new Set(
      [...listHtml.matchAll(/href="((?:https:\/\/deluxecruises\.com)?\/windstar\/star-breeze\/cruises-2026\/[^"#]+)"/gi)].map(
        (m) => m[1],
      ),
    ),
  ]
    .map((href) =>
      href.startsWith("http") ? href : `https://deluxecruises.com${href}`,
    )
    .filter((u) => !u.includes("calendar"));

  const byDate = new Map<string, DiscoveredEvent>();

  for (const pageUrl of relLinks.slice(0, 24)) {
    try {
      const html = await fetchHtml(pageUrl);
      if (!html) continue;
      const text = html
        .replace(/&#183;/g, "·")
        .replace(/&amp;/g, "&")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ");

      const re =
        /(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\s+MOOREA[^.]{0,200}?Arrives\s+(\d{2}:\d{2})[^.]{0,80}?Departs\s+(\d{2}:\d{2})/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        const date = englishDateToIso(Number(m[1]), m[2], Number(m[3]));
        if (!date || date < rangeStart || date > rangeEnd) continue;
        const startTime = `${m[4]}:00`;
        const endTime = `${m[5]}:00`;
        const externalId = `windstar-star-breeze-${date}`;
        byDate.set(date, {
          sourceId: "windstar-ports",
          externalId,
          title: "Escale croisière Windstar — MS Star Breeze à Moorea",
          description: [
            `Le MS Star Breeze (Windstar Cruises) est en escale à Moorea.`,
            `Arrivée prévue ${m[4]}, départ ${m[5]} (horaires publiés).`,
            `Excursions possibles sur l’île (vélo / e-bike, 4x4, snorkel, villages) — circulation et affluence possibles sur les routes.`,
            `Source itinéraire : ${pageUrl}`,
            marker("windstar-ports", externalId),
          ].join("\n\n"),
          category: "autre",
          date,
          startTime,
          endTime,
          location: "Moorea (escale portuaire)",
          organizer: "Windstar Cruises — MS Star Breeze",
          url: canonicalEventUrl(pageUrl, date),
        });
      }
    } catch (e) {
      errors.push(`windstar-ports ${pageUrl}: ${String(e).slice(0, 120)}`);
    }
  }

  return [...byDate.values()];
}

function decodeDuckDuckGoUrl(raw: string): string | null {
  try {
    const u = decodeURIComponent(raw);
    if (!u.startsWith("http")) return null;
    return u;
  } catch {
    return null;
  }
}

function isUsefulSearchUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (
      host.includes("duckduckgo") ||
      host.includes("facebook.com") ||
      host.includes("instagram.com") ||
      host.includes("youtube.com") ||
      host.includes("livenation") ||
      host.includes("amazon.") ||
      host.includes("wikipedia") ||
      host.includes("deluxecruises.com") ||
      host.includes("windstarcruises.com") ||
      host.includes("cruiseindustrynews")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Dates situées près d’un mot-clé Moorea / vélo (évite les dates marketing hors sujet). */
function datesNearMooreaSignal(
  plain: string,
  rangeStart: string,
  rangeEnd: string,
): string[] {
  const dates = new Set<string>();
  const window = 140;
  const signals: RegExp[] = [
    /moorea/gi,
    /v[eé]lo/gi,
    /\bbike\b/gi,
    /cycling/gi,
    /peloton/gi,
    /escale/gi,
  ];
  for (const signal of signals) {
    let m: RegExpExecArray | null;
    while ((m = signal.exec(plain))) {
      const slice = plain.slice(
        Math.max(0, m.index - window),
        m.index + window,
      );
      for (const dm of slice.matchAll(
        /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/gi,
      )) {
        const iso =
          frenchDateToIso(Number(dm[1]), dm[2], Number(dm[3])) ??
          englishDateToIso(Number(dm[1]), dm[2], Number(dm[3]));
        if (iso && iso >= rangeStart && iso <= rangeEnd) dates.add(iso);
      }
      for (const dm of slice.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
        const iso = `${dm[1]}-${dm[2]}-${dm[3]}`;
        if (iso >= rangeStart && iso <= rangeEnd) dates.add(iso);
      }
    }
  }
  return [...dates].sort();
}

async function discoverTourOperatorPages(
  rangeStart: string,
  rangeEnd: string,
  errors: string[],
): Promise<DiscoveredEvent[]> {
  const out: DiscoveredEvent[] = [];
  for (const page of TOUR_OPERATOR_WATCH_URLS) {
    const html = await fetchHtml(page.url);
    if (!html) {
      errors.push(`tour-op ${page.label}: inaccessible (${page.url})`);
      continue;
    }
    if (!mentionsMoorea(html)) continue;
    const plain = normalizeText(html);
    const dates = new Set<string>();
    for (const m of plain.matchAll(
      /(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre|January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/gi,
    )) {
      const fr = frenchDateToIso(Number(m[1]), m[2], Number(m[3]));
      const en = englishDateToIso(Number(m[1]), m[2], Number(m[3]));
      const iso = fr ?? en;
      if (iso && iso >= rangeStart && iso <= rangeEnd) dates.add(iso);
    }
    for (const m of plain.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
      const iso = `${m[1]}-${m[2]}-${m[3]}`;
      if (iso >= rangeStart && iso <= rangeEnd) dates.add(iso);
    }

    const bike =
      /v[eé]lo|bike|cycling|peloton/i.test(plain) ||
      /v[eé]lo|bike|cycling/i.test(page.label);

    for (const date of [...dates].sort()) {
      const externalId = `tour-op-${Buffer.from(page.url).toString("base64url").slice(0, 24)}-${date}`;
      out.push({
        sourceId: "tour-operator",
        externalId,
        title: bike
          ? `${page.label} — journée vélo / Moorea`
          : `${page.label} — Moorea`,
        description: [
          `Activité repérée chez un opérateur touristique (souvent hors agendas locaux).`,
          plain.slice(0, 900),
          marker("tour-operator", externalId),
        ].join("\n\n"),
        category: bike ? "sport" : "autre",
        date,
        location: "Moorea",
        organizer: page.label,
        url: canonicalEventUrl(page.url, date),
      });
    }
  }
  return out;
}

/**
 * Recherche web ciblée (pas un crawl du net entier) pour croisières / sport
 * qui n’apparaissent jamais sur Fenua Agenda ni Tahiti Tourisme.
 */
async function discoverWebSearchHints(
  rangeStart: string,
  rangeEnd: string,
  errors: string[],
): Promise<DiscoveredEvent[]> {
  const year = rangeStart.slice(0, 4);
  const urls = new Set<string>();

  for (const q of MOOREA_WEB_SEARCH_QUERIES) {
    const query = `${q} ${year}`;
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const html = await fetchHtml(searchUrl);
    if (!html) {
      errors.push(`web-search: échec « ${q.slice(0, 40)} »`);
      continue;
    }
    for (const m of html.matchAll(/uddg=([^&"]+)/g)) {
      const u = decodeDuckDuckGoUrl(m[1]);
      if (u && isUsefulSearchUrl(u)) urls.add(u.split("#")[0]);
    }
  }

  const out: DiscoveredEvent[] = [];
  for (const url of [...urls].slice(0, 18)) {
    try {
      const html = await fetchHtml(url);
      if (!html || !mentionsMoorea(html)) continue;
      const plain = normalizeText(html);
      const bike = /v[eé]lo|bike|cycling|peloton/i.test(plain);
      const cruisePort = /MOOREA[\s\S]{0,120}Arrives\s+\d{2}:\d{2}/i.test(
        html.replace(/<[^>]+>/g, " "),
      );
      const localEvent =
        /agenda|festival|foire|march[eé]\s|course\s|concert|spectacle/i.test(
          plain,
        );
      if (!bike && !cruisePort && !localEvent) continue;

      const uniqDates = datesNearMooreaSignal(plain, rangeStart, rangeEnd);
      if (uniqDates.length === 0) continue;

      const titleMatch =
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ??
        (bike
          ? "Activité vélo / circuit à Moorea"
          : cruisePort
            ? "Escale croisière — Moorea"
            : "Événement Moorea (veille web)");
      const title = decodeHtmlEntities(titleMatch)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 160);

      for (const date of uniqDates.slice(0, 2)) {
        const externalId = `websearch-${Buffer.from(url).toString("base64url").slice(0, 28)}-${date}`;
        out.push({
          sourceId: "web-search",
          externalId,
          title,
          description: [
            `Repéré par recherche web (hors agendas locaux).`,
            plain.slice(0, 1000),
            marker("web-search", externalId),
          ].join("\n\n"),
          category: bike
            ? "sport"
            : cruisePort
              ? "autre"
              : eventCategoryFromMessage(plain),
          date,
          location: "Moorea",
          organizer: cruisePort ? "Croisière / opérateur" : null,
          url: canonicalEventUrl(url, date),
        });
      }
    } catch (e) {
      errors.push(`web-search ${url}: ${String(e).slice(0, 100)}`);
    }
  }
  return out;
}

async function discoverFromTahitiTourismePage(
  pageUrl: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<DiscoveredEvent[]> {
  const html = await fetchHtml(pageUrl);
  if (!html) return [];
  const events = collectJsonLdEvents(html);
  const out: DiscoveredEvent[] = [];

  for (const ev of events) {
    const name = (ev.name ?? "").trim();
    if (!name) continue;
    const blob = `${name} ${ev.description ?? ""} ${locationFromJsonLd(ev)}`;
    if (!mentionsMoorea(blob) && !pageUrl.toLowerCase().includes("moorea")) {
      continue;
    }

    const occ = extractOccurrenceDates(html, rangeStart, rangeEnd);
    const startIso = (ev.startDate ?? "").slice(0, 10);
    const dates =
      occ.length > 0
        ? occ
        : startIso && startIso >= rangeStart && startIso <= rangeEnd
          ? [startIso]
          : [];

    const hours = html.match(
      /De\s+(\d{1,2})\s*[h:]\s*(\d{2})?\s+à\s+(\d{1,2})\s*[h:]\s*(\d{2})?/i,
    );
    const startTime = hours
      ? `${pad2(Number(hours[1]))}:${pad2(Number(hours[2] ?? 0))}:00`
      : null;
    const endTime = hours
      ? `${pad2(Number(hours[3]))}:${pad2(Number(hours[4] ?? 0))}:00`
      : null;

    for (const date of dates) {
      const externalId = `${Buffer.from(pageUrl).toString("base64url").slice(0, 40)}-${date}`;
      out.push({
        sourceId: "tahiti-tourisme",
        externalId,
        title: name.slice(0, 200),
        description: `${(ev.description ?? name).slice(0, 2500)}\n\n${marker("tahiti-tourisme", externalId)}`,
        category: eventCategoryFromMessage(`${name} ${ev.description ?? ""}`),
        date,
        endDate: null,
        startTime,
        endTime,
        location: locationFromJsonLd(ev).slice(0, 200),
        district: parseDistrictFromMessage(blob),
        organizer: "Tahiti Tourisme",
        url: canonicalEventUrl(ev.url || pageUrl, date),
        coverUrl: imageFromJsonLd(ev),
      });
    }
  }

  return out;
}

async function discoverTahitiTourisme(
  rangeStart: string,
  rangeEnd: string,
  errors: string[],
): Promise<DiscoveredEvent[]> {
  const urls = new Set(TAHITI_TOURISME_MOOREA_SEEDS.map((s) => s.url));

  for (const listing of TAHITI_TOURISME_LISTING_URLS) {
    const html = await fetchHtml(listing);
    if (!html) {
      errors.push(`tahiti-tourisme listing: échec ${listing}`);
      continue;
    }
    for (const m of html.matchAll(
      /https:\/\/tahititourisme\.pf\/agenda\/tout-lagenda\/([a-z0-9-]+-fr-\d+)\//gi,
    )) {
      const slug = m[1];
      if (slug.toLowerCase().includes("moorea")) {
        urls.add(`https://tahititourisme.pf/agenda/tout-lagenda/${slug}/`);
      }
    }
  }

  const out: DiscoveredEvent[] = [];
  for (const url of urls) {
    try {
      const found = await discoverFromTahitiTourismePage(
        url,
        rangeStart,
        rangeEnd,
      );
      out.push(...found);
    } catch (e) {
      errors.push(`tahiti-tourisme ${url}: ${String(e).slice(0, 160)}`);
    }
  }
  return out;
}

type FenuaDated = { date: string; time: string | null };

function parseFenuaDatedPairs(html: string): FenuaDated[] {
  const out: FenuaDated[] = [];
  const re =
    /(?:Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s*,\s*(\d{1,2}\s+(?:janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+20\d{2})(?:\s+à\s+(\d{1,2}h\d{0,2}))?/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const date = parseFrenchLongDate(m[1]);
    if (!date) continue;
    out.push({ date, time: m[2] ? toTimeDb(m[2]) : null });
  }
  return out;
}

async function discoverFenuaAgenda(
  rangeStart: string,
  rangeEnd: string,
  errors: string[],
): Promise<DiscoveredEvent[]> {
  const listHtml = await fetchHtml(FENUA_AGENDA_MOOREA_LIST);
  if (!listHtml) {
    errors.push("fenua-agenda: listing Moorea inaccessible");
    return [];
  }

  const ids = [...new Set([...listHtml.matchAll(/id_event=(\d+)/g)].map((m) => m[1]))];
  const out: DiscoveredEvent[] = [];

  for (const id of ids.slice(0, 40)) {
    const url = `${FENUA_AGENDA_EVENT_BASE}${id}`;
    try {
      const html = await fetchHtml(url);
      if (!html) {
        errors.push(`fenua-agenda ${id}: fetch failed`);
        continue;
      }
      if (!mentionsMoorea(html)) continue;

      const heads = [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
        .map((h) => normalizeText(h[1]))
        .filter(
          (t) =>
            t.length > 3 &&
            ![
              "description",
              "localisation",
              "tarifications",
              "services proposés",
              "même jour même lieux !",
            ].includes(t.toLowerCase()),
        );
      const title = heads[0];
      if (!title) continue;

      const dated = parseFenuaDatedPairs(html).filter(
        (d) => d.date >= rangeStart && d.date <= rangeEnd,
      );
      // Pas de repli sur la date du bandeau site (« Dimanche 16 août ») — trop trompeur.
      if (dated.length === 0) continue;

      const start = dated[0];
      const end = dated.length > 1 ? dated[dated.length - 1] : null;
      const locationGuess =
        heads.find((h, i) => i > 0 && h.length < 80 && !/visites/i.test(h)) ??
        "Moorea";
      const plain = normalizeText(html);
      const descMatch = plain.match(/Description\s+(.{80,1200}?)(?:Localisation|Tarifications|Services|$)/i);
      const description =
        descMatch?.[1]?.trim() ||
        `${title} — événement signalé sur Fenua Agenda (Moorea).`;

      const externalId = `fenua-${id}-${start.date}`;
      out.push({
        sourceId: "fenua-agenda",
        externalId,
        title: title.slice(0, 200),
        description: `${description.slice(0, 2500)}\n\n${marker("fenua-agenda", externalId)}`,
        category: eventCategoryFromMessage(`${title} ${description}`),
        date: start.date,
        endDate:
          end && end.date !== start.date ? end.date : null,
        startTime: start.time,
        endTime: end && end.date === start.date ? end.time : null,
        location: locationGuess.slice(0, 200),
        district: parseDistrictFromMessage(`${title} ${locationGuess} ${description}`),
        organizer: "Fenua Agenda",
        url: canonicalEventUrl(url, start.date),
      });
    } catch (e) {
      errors.push(`fenua-agenda ${id}: ${String(e).slice(0, 160)}`);
    }
  }

  return out;
}

async function upsertDiscoveredEvents(
  events: DiscoveredEvent[],
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { inserted: 0, updated: 0, skipped: events.length };
  }

  const published = webEventsPublishedByDefault();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const ev of events) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("url", ev.url)
      .maybeSingle();

    const row = {
      title: ev.title,
      description: ev.description,
      category: ev.category,
      date: ev.date,
      end_date: ev.endDate ?? null,
      start_time: ev.startTime ?? null,
      end_time: ev.endTime ?? null,
      location: ev.location || "Moorea",
      district: ev.district ?? null,
      organizer: ev.organizer ?? null,
      price: ev.price ?? null,
      url: ev.url,
      cover_url: ev.coverUrl ?? null,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      // Contenu seulement — on ne republie pas un événement dépublié à la main.
      const { error } = await supabase
        .from("events")
        .update(row)
        .eq("id", existing.id);
      if (error) skipped += 1;
      else updated += 1;
      continue;
    }

    const { error } = await supabase.from("events").insert({
      ...row,
      published,
    });
    if (error) skipped += 1;
    else inserted += 1;
  }

  return { inserted, updated, skipped };
}

function dedupeEvents(events: DiscoveredEvent[]): DiscoveredEvent[] {
  const byKey = new Map<string, DiscoveredEvent>();
  for (const ev of events) {
    const key = `${ev.date}|${ev.title
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()}`;
    if (!byKey.has(key)) byKey.set(key, ev);
  }
  return [...byKey.values()];
}

/** Point d’entrée : fouille les sources et upsert dans `events`. */
export async function discoverWeekendMooreaEvents(
  now = new Date(),
): Promise<WebEventDiscoveryResult> {
  const { start, end, week } = getDiscoveryDateWindow(now);
  const errors: string[] = [];
  const bySource: Record<string, number> = {};

  const batches: DiscoveredEvent[][] = [];

  batches.push(discoverRecurringMarcheBio(start, end));
  batches.push(discoverCruiseSeeds(start, end));

  try {
    batches.push(await discoverWindstarMooreaPortDays(start, end, errors));
  } catch (e) {
    errors.push(`windstar-ports: ${String(e).slice(0, 200)}`);
  }

  try {
    batches.push(await discoverTourOperatorPages(start, end, errors));
  } catch (e) {
    errors.push(`tour-operator: ${String(e).slice(0, 200)}`);
  }

  try {
    batches.push(await discoverWebSearchHints(start, end, errors));
  } catch (e) {
    errors.push(`web-search: ${String(e).slice(0, 200)}`);
  }

  try {
    batches.push(await discoverTahitiTourisme(start, end, errors));
  } catch (e) {
    errors.push(`tahiti-tourisme: ${String(e).slice(0, 200)}`);
  }

  try {
    batches.push(await discoverFenuaAgenda(start, end, errors));
  } catch (e) {
    errors.push(`fenua-agenda: ${String(e).slice(0, 200)}`);
  }

  const discovered = dedupeEvents(batches.flat());
  for (const ev of discovered) {
    bySource[ev.sourceId] = (bySource[ev.sourceId] ?? 0) + 1;
  }

  const { inserted, updated, skipped } = await upsertDiscoveredEvents(discovered);

  return {
    ok: errors.length === 0 || discovered.length > 0,
    weekLabel: week.label,
    rangeStart: start,
    rangeEnd: end,
    discovered: discovered.length,
    inserted,
    updated,
    skipped,
    bySource,
    titles: discovered.slice(0, 20).map((e) => `${e.date} — ${e.title}`),
    errors: errors.slice(0, 20),
  };
}
