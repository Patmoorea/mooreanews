/**
 * Extraction date / lieu / type depuis un post Facebook (texte + affiche).
 */

import { MOOREA_DISTRICTS } from "@/lib/constants";

export type FacebookPostKind = "event" | "announcement" | "article";

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

const EVENT_KEYWORDS = [
  "événement",
  "evenement",
  "concert",
  "marché",
  "marche",
  "fête",
  "fete",
  "spectacle",
  "course",
  "tamure",
  "exposition",
  "inauguration",
  "réunion",
  "rassemblement",
  "invitation",
  "flyer",
  "affiche",
  "agenda",
  "festival",
  "soirée",
  "soiree",
];

const ANNOUNCEMENT_KEYWORDS = [
  "à vendre",
  "a vendre",
  "vends ",
  "vente ",
  "loue ",
  "location ",
  "cherche ",
  "petite annonce",
  "emploi",
  "recrute",
  "occasion",
  "urgent",
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function referenceFromFallback(fallbackIso?: string): Date {
  if (fallbackIso) {
    const d = new Date(`${fallbackIso.slice(0, 10)}T12:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

/** « Ce vendredi », « samedi soir » sans date explicite (risque de réinterprétation chaque semaine). */
export function hasRelativeWeekdayDate(text: string): boolean {
  const norm = normalize(text);
  const hasWeekday = WEEKDAYS.some((w) => norm.includes(w));
  if (!hasWeekday) return false;

  if (/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/.test(text)) return false;
  if (
    /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(20\d{2}))\b/i.test(
      text,
    )
  ) {
    return false;
  }
  return true;
}

/** Cherche une date dans le texte (formats courants PF). */
export function parseDateFromMessage(
  message: string,
  fallbackIso?: string,
): string | null {
  const text = message.trim();
  if (!text) return fallbackIso ?? null;

  const dmY = text.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/);
  if (dmY) {
    const iso = toIsoDate(
      Number(dmY[3]),
      Number(dmY[2]),
      Number(dmY[1]),
    );
    if (iso) return iso;
  }

  const dayMonth = text.match(
    /\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:\s+(20\d{2}))?\b/i,
  );
  if (dayMonth) {
    const monthKey = dayMonth[2].toLowerCase();
    const month = MONTHS[monthKey] ?? MONTHS[normalize(monthKey)];
    const refYear = referenceFromFallback(fallbackIso).getFullYear();
    const year = dayMonth[3] ? Number(dayMonth[3]) : refYear;
    if (month) {
      const iso = toIsoDate(year, month, Number(dayMonth[1]));
      if (iso) return iso;
    }
  }

  const norm = normalize(text);
  const ref = referenceFromFallback(fallbackIso);
  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (!norm.includes(WEEKDAYS[i])) continue;
    const target = i;
    const current = ref.getDay();
    let delta = target - current;
    if (delta <= 0) delta += 7;
    const d = new Date(ref);
    d.setDate(ref.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }

  return fallbackIso?.slice(0, 10) ?? null;
}

/** Extrait une heure « 9h », « 18h30 », « 9:00 ». */
export function parseTimeFromMessage(message: string): string | null {
  const m = message.match(/\b(\d{1,2})\s*[h:]\s*(\d{2})?\b/i);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return `${pad2(h)}:${pad2(min)}:00`;
}

/** Repère un village / quartier Moorea dans le texte. */
export function parseDistrictFromMessage(message: string): string | null {
  const norm = normalize(message);
  for (const d of MOOREA_DISTRICTS) {
    if (norm.includes(normalize(d))) return d;
  }
  if (norm.includes("debarcadere") || norm.includes("débarcadère")) {
    return "Paopao";
  }
  return null;
}

export function parseLocationFromMessage(message: string): string {
  const district = parseDistrictFromMessage(message);
  if (district) return district;

  const lieu = message.match(
    /(?:à|au|a|chez|lieu\s*:|adresse\s*:)\s*([^\n,.]{3,60})/i,
  );
  if (lieu?.[1]) return lieu[1].trim();

  return "Moorea";
}

export function eventCategoryFromMessage(message: string): string {
  const n = normalize(message);
  if (n.includes("marche") || n.includes("marché")) return "marche";
  if (n.includes("concert") || n.includes("musique") || n.includes("dj"))
    return "musique";
  if (n.includes("sport") || n.includes("course") || n.includes("va'a"))
    return "sport";
  if (n.includes("fete") || n.includes("fête") || n.includes("tamure"))
    return "fete";
  if (n.includes("culture") || n.includes("expo")) return "culture";
  if (n.includes("atelier")) return "atelier";
  if (n.includes("eglise") || n.includes("église") || n.includes("messe"))
    return "religieux";
  return "communaute";
}

export function announcementCategoryFromMessage(message: string): string {
  const n = normalize(message);
  if (n.includes("emploi") || n.includes("recrute")) return "emploi";
  if (n.includes("loue") || n.includes("location")) return "location";
  if (n.includes("vends") || n.includes("vente") || n.includes("vendre"))
    return "vente";
  if (n.includes("cherche")) return "achat";
  if (n.includes("service") || n.includes("artisan")) return "service";
  return "service";
}

/** Affiche + texte → événement ; annonce → annonces ; sinon actualité. */
export function classifyFacebookPost(
  message: string,
  hasImage: boolean,
): FacebookPostKind {
  const n = normalize(message);

  if (ANNOUNCEMENT_KEYWORDS.some((k) => n.includes(normalize(k)))) {
    return "announcement";
  }

  // Avis ferry / carénage → alerte (pas événement agenda)
  if (
    [
      "ferry",
      "traversee",
      "traversée",
      "carenage",
      "carénage",
      "navire",
      "indisponible",
      "perturbation",
      "tauati",
      "aremiti",
    ].some((k) => n.includes(k))
  ) {
    return "article";
  }

  const hasDate = parseDateFromMessage(message) !== null;
  const hasEventWord = EVENT_KEYWORDS.some((k) => n.includes(normalize(k)));

  if (
    hasImage &&
    message.trim().length > 0 &&
    (hasDate || hasEventWord) &&
    message.trim().length < 400
  ) {
    return "event";
  }

  if (hasDate && hasEventWord) return "event";

  return "article";
}

export function titleFromMessage(message: string, fallback: string): string {
  const lines = message
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 3);
  for (const line of lines) {
    if (/^https?:\/\//i.test(line)) continue;
    if (/facebook\.com/i.test(line) && line.length < 150) continue;
    return line.slice(0, 200);
  }
  return fallback;
}
