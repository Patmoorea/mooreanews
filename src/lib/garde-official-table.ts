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
const PHONE_G = /\b((?:40|87|89)(?:[ .\-]?\d{2}){3})\b/g;
const DOCTOR_RE = /^(?:Dr\.?\s+.+|CENTRE\s+M[ÉE]DICAL.+)$/i;
const HOURS_RE = /samedi|dimanche|f[ée]ri|\d{1,2}h/i;

function strip(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function fmtPhone(raw: string): string {
  return (raw.replace(/\D/g, "").match(/\d{2}/g) ?? []).join(" ");
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
  return h.replace(/\s+/g, " ").replace(/\s*[-–—]\s*/g, " – ").trim();
}

export function parseOfficialHours(line: string): { saturday?: string; sunday?: string } {
  const sat = line.match(/samedi\s*:?\s*(\d{1,2}h\d{0,2}\s*[-–—]\s*\d{1,2}h\d{0,2})/i);
  const sun = line.match(
    /(?:dimanche|f[ée]ri[ée]|f[ée]n[ée]|f[ée]r[ée])[^\d]{0,20}(\d{1,2}h\d{0,2}\s*[-–à]+\s*\d{1,2}h\d{0,2})/i,
  );
  return { saturday: normHours(sat?.[1]), sunday: normHours(sun?.[1]?.replace(/\s*à\s*/, " – ")) };
}

export function parseOfficialWeek(text: string): {
  week: number | null;
  validFrom: string | null;
  validTo: string | null;
} {
  const n = strip(text);
  const week = n.match(/semaine\s*n\s*[°o]?\s*(\d{1,2})/);
  const d = n.match(
    /samedi\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})\s*\/\s*dimanche\s+(\d{1,2})\s+([a-z]+)\s+(\d{4})/,
  );
  const key = (y: string, m: string, day: string) => {
    const mm = MONTHS[m];
    return mm ? `${y}-${String(mm).padStart(2, "0")}-${day.padStart(2, "0")}` : null;
  };
  return {
    week: week ? Number(week[1]) : null,
    validFrom: d ? key(d[3]!, d[2]!, d[1]!) : null,
    validTo: d ? key(d[6]!, d[5]!, d[4]!) : null,
  };
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
      otherPhones: allPhones.filter((p) => p !== phone),
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
 * Refuse toute donnée incohérente. Les jours fériés en semaine passent par
 * `allowDates` (dates attendues explicites).
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
  if (!/^(40|87|89)( \d{2}){3}$/.test(g.phone)) issues.push(`numéro invalide : ${g.phone}`);
  // Fixe à Moorea = 40 55 / 40 56. Un 40 57, 40 50, 40 80… = autre secteur (décalage de ligne).
  if (/^40 /.test(g.phone) && !/^40 5[56] /.test(g.phone)) {
    issues.push(`préfixe ${g.phone.slice(0, 5)} hors Moorea (décalage de ligne probable)`);
  }
  if (g.otherDoctors.includes(g.doctorName)) issues.push("médecin présent sur une autre ligne");
  if (g.otherPhones.includes(g.phone)) issues.push("numéro présent sur une autre ligne");
  if (!g.saturday && !g.sunday) issues.push("horaires absents");

  const want = allowDates ?? expectedWeekend(now);
  if (!g.validFrom || !g.validTo) {
    issues.push("dates du tableau illisibles");
  } else if (g.validFrom !== want.validFrom || g.validTo !== want.validTo) {
    issues.push(`dates ${g.validFrom}/${g.validTo} ≠ week-end attendu ${want.validFrom}/${want.validTo}`);
  }
  return { ok: issues.length === 0, issues };
}
