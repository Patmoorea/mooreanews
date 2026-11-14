/**
 * Tour de garde officiel des médecins généralistes de Polynésie française
 * (Conseil de l'Ordre des médecins, affiche hebdo relayée par le Conseil de l'Ordre
 * des pharmaciens : https://www.ordre-pharmaciens-polynesie.com/medecins-de-garde/).
 *
 * Lecture ROBUSTE de la ligne « Moorea » quelle que soit la façon dont l'OCR lit le tableau :
 *  - « table » (OCR.space isTable) :  Dr X ⏎ Moorea<TAB>40 56 .. .. ⏎ Samedi …
 *  - « lignes » :                     Moorea ⏎ Dr X ⏎ Samedi … ⏎ 40 56 .. ..
 *  - « colonnes » (toutes les îles, puis tous les médecins, puis tous les n°) :
 *    accepté seulement si les comptes avant Moorea sont cohérents.
 * Puis validation stricte : en cas de doute on NE publie PAS.
 */

import {
  formatTahitiDay,
  tahitiDateKey,
  tahitiHolidayLabel,
  upcomingWeekdayHoliday,
} from "@/lib/tahiti-holidays";

export type OfficialMooreaGarde = {
  week: number | null;
  validFrom: string | null;
  validTo: string | null;
  doctorName: string;
  phone: string;
  saturday?: string;
  sunday?: string;
  layout: "table" | "rows" | "columns";
  /** Médecins / n° des autres secteurs (pour détecter un décalage). */
  otherDoctors: string[];
  otherPhones: string[];
};

const MONTHS: Record<string, number> = {
  janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12,
};

const SECTOR_RE =
  /^(secteur\s+papeete|et\s+punaa|arue|paea\b|papara|taravao|moorea\b|bora|huahine|raiatea|tahaa|rangiroa|clinique|polyclinique)/;
/**
 * N° polynésien = 8 chiffres (40/87/89 + 6), quel que soit le regroupement imprimé :
 * « 87 000 800 » (SEM44), « 87 00 08 00 », « 87000800 », « 87.00.08.00 », « 4046 1818 ».
 */
const PHONE_G = /(?<!\d)((?:40|87|89)(?:[ .\-]?\d){6})(?!\d)/g;
const DOCTOR_RE = /^(?:Dr\.?\s+.+|CENTRE\s+M[ÉE]DICAL.+)$/i;
const HOURS_RE = /samedi|dimanche|f[ée]ri|\d{1,2}h/i;

function strip(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Chiffres seuls (comparaisons, validation). */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Garde le regroupement imprimé sur l'affiche (« 87 000 800 ») ; sans séparateur
 * ou avec un regroupement bancal, retombe sur des paires (« 87 00 08 00 »).
 */
export function fmtPhone(raw: string): string {
  const groups = raw.trim().split(/[ .\-]+/).filter(Boolean);
  const digits = phoneDigits(raw);
  if (groups.length >= 3 && groups.every((g) => g.length >= 2 && g.length <= 3)) {
    return groups.join(" ");
  }
  return (digits.match(/\d{2}/g) ?? []).join(" ");
}

function phonesIn(line: string): string[] {
  return [...line.matchAll(PHONE_G)].map((m) => fmtPhone(m[1]!));
}

function cleanDoctor(line: string): string {
  return line
    .replace(/\t.*$/, "")
    .replace(/\s*\((?:rempla[cç][ée]e?|remplacant)\)\s*/i, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^Dr\.?\s+/i, "Dr ");
}

function normHours(h?: string): string | undefined {
  if (!h) return undefined;
  return h.replace(/\s+/g, " ").replace(/\s*[-–—−]\s*/g, " – ").trim();
}

/**
 * « Férié » est souvent lu « Fév », « Féri », « Féré », « féné » par Tesseract.
 * Le tiret long (—) du tableau doit compter comme un séparateur d'heures.
 */
const FERIE_WORD =
  /(?:dimanche|f[eéèê]r(?:i[eéèêë]?|é|e)?s?|f[eéèê]n[eéèê]|f[eéèê]v|jours?\s+f[eéèê]r\w*)/i;
const HOUR_RANGE = /(\d{1,2}h\d{0,2}\s*[-–—−àa]+\s*\d{1,2}h\d{0,2})/i;

export function parseOfficialHours(line: string): { saturday?: string; sunday?: string } {
  const sat = line.match(new RegExp(`samedi\\s*:?\\s*${HOUR_RANGE.source}`, "i"));
  const sun = line.match(new RegExp(`${FERIE_WORD.source}[^\\d]{0,24}${HOUR_RANGE.source}`, "i"));
  return { saturday: normHours(sat?.[1]), sunday: normHours(sun?.[1]?.replace(/\s*à\s*/i, " – ")) };
}

function monthOf(token?: string): number | undefined {
  if (!token) return undefined;
  const t = token.replace(/\./g, "");
  if (MONTHS[t]) return MONTHS[t];
  if (t.length < 3) return undefined;
  const found = Object.keys(MONTHS).find((name) => name.startsWith(t));
  return found ? MONTHS[found] : undefined;
}

function yearIn(text: string, explicit: Array<string | undefined>): number | null {
  for (const value of explicit) {
    if (value && /^20\d{2}$/.test(value)) return Number(value);
  }
  const years = [...text.matchAll(/\b(202\d)\b/g)].map((match) => Number(match[1]));
  if (!years.length) return null;
  const counts = new Map<number, number>();
  for (const year of years) counts.set(year, (counts.get(year) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function isoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Samedi et dimanche de la semaine ISO (lundi = jour 1). */
export function weekendOfIsoWeek(year: number, isoWeek: number): { validFrom: string; validTo: string } | null {
  if (isoWeek < 1 || isoWeek > 53) return null;
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (isoWeek - 1) * 7);
  const saturday = new Date(monday);
  saturday.setUTCDate(monday.getUTCDate() + 5);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    validFrom: saturday.toISOString().slice(0, 10),
    validTo: sunday.toISOString().slice(0, 10),
  };
}

/**
 * En-tête de tableau. L'ancienne forme exigeait un « / » et les deux années
 * (« samedi 14 novembre 2026 / dimanche 15 novembre 2026 »). Un erratum surligné,
 * un tiret, « nov. » ou une année manquante laissait les dates vides.
 */
function readWeekendHeader(text: string): { validFrom: string; validTo: string } | null {
  const re =
    /samedi\s+(\d{1,2})(?:\s+([a-z.]+))?(?:\s+(20\d{2}))?\s*(?:\/|\||\bet\b|[-–—])\s*dimanche\s+(\d{1,2})(?:\s+([a-z.]+))?(?:\s+(20\d{2}))?/g;
  let weak: { validFrom: string; validTo: string } | null = null;
  for (const match of text.matchAll(re)) {
    const day1 = Number(match[1]);
    const day2 = Number(match[4]);
    const month1 = monthOf(match[2]);
    const month2 = monthOf(match[5]);
    const year = yearIn(text, [match[3], match[6]]);
    if (!year || !day1 || !day2) continue;
    let fromMonth = month1 ?? month2;
    let toMonth = month2 ?? month1;
    let fromYear = year;
    let toYear = year;
    if (!fromMonth || !toMonth) continue;
    if (!month1 && month2 && day2 < day1) {
      fromMonth = month2 === 1 ? 12 : month2 - 1;
      if (month2 === 1) fromYear = year - 1;
    } else if (month1 && !month2 && day2 < day1) {
      toMonth = month1 === 12 ? 1 : month1 + 1;
      if (month1 === 12) toYear = year + 1;
    } else if (month1 && month2 && month2 < month1) {
      toYear = year + 1;
    }
    const validFrom = isoDate(fromYear, fromMonth, day1);
    const validTo = isoDate(toYear, toMonth, day2);
    if (!validFrom || !validTo || validTo < validFrom) continue;
    const parsed = { validFrom, validTo };
    if (month1 && month2) return parsed;
    weak ??= parsed;
  }
  return weak;
}

export function parseOfficialWeek(text: string): {
  week: number | null;
  validFrom: string | null;
  validTo: string | null;
} {
  const n = strip(text);
  const week = n.match(/semaine\s*n\s*[°o.]?\s*(\d{1,2})/);
  const weekNum = week ? Number(week[1]) : null;
  const header = readWeekendHeader(n);
  if (header) return { week: weekNum, ...header };

  // « Mercredi 11 novembre 2026 - Férié » ou « mercredi 11 nov. 2026 ».
  if (/ferie|fete/.test(n)) {
    const one = n.match(
      /(?:lundi|mardi|mercredi|jeudi|vendredi)\s+(\d{1,2})\s+([a-z.]+)(?:\s+(20\d{2}))?/,
    );
    const month = monthOf(one?.[2]);
    const year = one ? yearIn(n, [one[3]]) : null;
    const iso = one && month && year ? isoDate(year, month, Number(one[1])) : null;
    if (iso) return { week: weekNum, validFrom: iso, validTo: iso };
  }

  // « Semaine n°46 » encore lisible, sans la ligne de dates.
  if (weekNum) {
    const year = yearIn(n, []);
    const range = year ? weekendOfIsoWeek(year, weekNum) : null;
    if (range) return { week: weekNum, ...range };
  }

  return { week: weekNum, validFrom: null, validTo: null };
}

/** Vrai pour l'échec « dates du tableau illisibles », pas pour une mauvaise semaine. */
export function isUnreadableDateIssue(issue: string): boolean {
  return issue.includes("illisibles");
}

/** Libellé publiable : week-end samedi/dimanche, ou le jour férié lui-même. */
export function officialPeriodLabel(validFrom: string, validTo: string): string {
  if (validFrom === validTo) {
    const d = new Date(`${validFrom}T12:00:00-10:00`);
    const holiday = tahitiHolidayLabel(d);
    const day = formatTahitiDay(d);
    const titled = day ? day.charAt(0).toUpperCase() + day.slice(1) : validFrom;
    return holiday ? `${titled} — ${holiday}` : titled;
  }
  const month = new Date(`${validTo}T12:00:00Z`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Samedi ${Number(validFrom.slice(8))} / Dimanche ${Number(validTo.slice(8))} ${month}`;
}

function isSector(line: string): boolean {
  return SECTOR_RE.test(strip(line));
}

export function parseOfficialMooreaGarde(text: string): OfficialMooreaGarde | null {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\t+$/, "").trim()).filter(Boolean);
  const i = lines.findIndex((l) => /^moorea\b/.test(strip(l)));
  if (i < 0) return null;
  const meta = parseOfficialWeek(text);
  const allDoctors = lines.filter((l) => DOCTOR_RE.test(l)).map(cleanDoctor);
  const allPhones = lines.flatMap(phonesIn);

  const build = (
    layout: OfficialMooreaGarde["layout"],
    doctorLine: string,
    phone: string,
    hoursLine: string,
  ): OfficialMooreaGarde => {
    const doctorName = cleanDoctor(doctorLine);
    return {
      ...meta,
      doctorName,
      phone,
      ...parseOfficialHours(hoursLine),
      layout,
      otherDoctors: allDoctors.filter((d) => d !== doctorName),
      otherPhones: allPhones.filter((p) => phoneDigits(p) !== phoneDigits(phone)),
    };
  };

  // 1) Mise en page « table » : la ligne Moorea porte le n°, le médecin est juste au-dessus.
  const ownPhones = phonesIn(lines[i]!);
  if (ownPhones.length > 0) {
    const doc = lines[i - 1] ?? "";
    if (!DOCTOR_RE.test(doc) || isSector(doc)) return null;
    return build("table", doc, ownPhones[0]!, lines[i + 1] ?? "");
  }

  // 2) Mise en page « lignes » : Moorea / médecin / horaires / n°.
  const next = lines[i + 1] ?? "";
  if (DOCTOR_RE.test(next)) {
    const hours = HOURS_RE.test(lines[i + 2] ?? "") ? lines[i + 2]! : "";
    const phoneLine = hours ? lines[i + 3] ?? "" : lines[i + 2] ?? "";
    const p = phonesIn(phoneLine);
    if (!p.length || isSector(phoneLine)) return null;
    return build("rows", next, p[0]!, hours);
  }

  // 3) Mise en page « colonnes » : alignement par rang, avec garde-fous.
  const sectorsBefore = lines.slice(0, i).filter((l) => isSector(l) && !/^(et\s+punaa|arue)/.test(strip(l)));
  const rank = sectorsBefore.length;
  const doctorIdx = lines
    .map((l, idx) => (DOCTOR_RE.test(l) ? idx : -1))
    .filter((idx) => idx > i);
  const phoneLines = lines
    .map((l, idx) => ({ idx, p: phonesIn(l) }))
    .filter((x) => x.idx > i && x.p.length > 0);
  // Une ligne = un secteur, même si elle porte 2 n° (« 40 80 00 80 / 87 77 75 37 »).
  if (doctorIdx.length <= rank || phoneLines.length <= rank) return null;
  const dIdx = doctorIdx[rank]!;
  const hoursLine = HOURS_RE.test(lines[dIdx + 1] ?? "") ? lines[dIdx + 1]! : "";
  return build("columns", lines[dIdx]!, phoneLines[rank]!.p[0]!, hoursLine);
}

/* ---------------------------- validation ---------------------------- */

export type GardeValidation = { ok: boolean; issues: string[] };

/** Samedi/dimanche du week-end en cours ou à venir (heure de Tahiti). */
export function expectedWeekend(now: Date): { validFrom: string; validTo: string } {
  const tahiti = new Date(now.getTime() - 10 * 3600_000);
  const dow = tahiti.getUTCDay(); // 0 = dimanche
  const toSat = dow === 0 ? -1 : 6 - dow;
  const sat = new Date(Date.UTC(tahiti.getUTCFullYear(), tahiti.getUTCMonth(), tahiti.getUTCDate() + toSat));
  const sun = new Date(sat.getTime() + 86400_000);
  return { validFrom: sat.toISOString().slice(0, 10), validTo: sun.toISOString().slice(0, 10) };
}

/**
 * Période à publier : un jour férié en semaine (aujourd'hui ou sous 2 jours)
 * passe avant le week-end qui suit. Un dimanche férié reste dans le week-end.
 */
export function expectedGardePeriod(now: Date): { validFrom: string; validTo: string } {
  const weekend = expectedWeekend(now);
  const holiday = upcomingWeekdayHoliday(now);
  if (!holiday) return weekend;
  if (holiday.validFrom < weekend.validFrom) return holiday;
  if (tahitiDateKey(now) > weekend.validTo) return holiday;
  return weekend;
}

/**
 * Refuse toute donnée incohérente. Sans `allowDates`, la période attendue est
 * `expectedGardePeriod` (férié en semaine, sinon le week-end).
 */
export function validateOfficialMooreaGarde(
  g: OfficialMooreaGarde | null,
  now: Date,
  allowDates?: { validFrom: string; validTo: string },
): GardeValidation {
  const issues: string[] = [];
  if (!g) return { ok: false, issues: ["ligne Moorea introuvable dans le tableau officiel"] };

  if (!/^Dr [A-ZÀ-Ü'\-]{2,}/.test(g.doctorName) && !/^CENTRE/i.test(g.doctorName)) {
    issues.push(`nom de médecin suspect : « ${g.doctorName} »`);
  }
  const digits = phoneDigits(g.phone);
  if (!/^(40|87|89)\d{6}$/.test(digits)) issues.push(`numéro invalide : ${g.phone}`);
  // Fixe à Moorea = 40 55 / 40 56. Un 40 57, 40 50, 40 80… = autre secteur (décalage de ligne).
  if (digits.startsWith("40") && !/^405[56]/.test(digits)) {
    issues.push(`préfixe ${digits.slice(0, 2)} ${digits.slice(2, 4)} hors Moorea (décalage de ligne probable)`);
  }
  if (g.otherDoctors.includes(g.doctorName)) issues.push("médecin présent sur une autre ligne");
  if (g.otherPhones.some((p) => phoneDigits(p) === digits)) issues.push("numéro présent sur une autre ligne");
  if (!g.saturday && !g.sunday) issues.push("horaires absents");

  const want = allowDates ?? expectedGardePeriod(now);
  if (!g.validFrom || !g.validTo) {
    issues.push("dates du tableau illisibles");
  } else if (g.validFrom !== want.validFrom || g.validTo !== want.validTo) {
    issues.push(`dates ${g.validFrom}/${g.validTo} ≠ période attendue ${want.validFrom}/${want.validTo}`);
  }
  return { ok: issues.length === 0, issues };
}
