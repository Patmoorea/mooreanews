/**
 * Extraction Moorea depuis le texte OCR du planning COPPF (document week-end).
 */

const TZ = "Pacific/Tahiti";

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

/** Secteurs qui suivent Moorea dans le document officiel. */
const SECTOR_AFTER_MOOREA =
  /Bora[- ]?Bora|Huahine|Raiatea|Tahaa|Rangiroa|Clinique|Polyclinique/i;

export type CoppfMooreaOcrResult = {
  doctorName: string;
  phone: string;
  phoneHref: string;
  weekendLabel: string;
  validFrom: string;
  validTo: string;
};

function normalizeOcrText(text: string): string {
  return text
    .replace(/\u2019/g, "'")
    .replace(/[|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function tahitiDateKey(y: number, m: number, day: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseFrenchDate(day: number, monthRaw: string, year: number): string | null {
  const month = FRENCH_MONTHS[stripAccents(monthRaw.trim())];
  if (!month) return null;
  return tahitiDateKey(year, month, day);
}

/** Dates du week-end couvert par le document (Samedi … / Dimanche …). */
export function parseCoppfWeekendDates(text: string): {
  saturdayKey: string;
  sundayKey: string;
  label: string;
} | null {
  const m = text.match(
    /Samedi\s+(\d{1,2})\s+([A-Za-zÀ-ÿéûîôù]+)\s+(\d{4})\s*\/\s*Dimanche\s+(\d{1,2})\s+([A-Za-zÀ-ÿéûîôù]+)\s+(\d{4})/i,
  );
  if (!m) return null;

  const satKey = parseFrenchDate(Number(m[1]), m[2]!, Number(m[3]));
  const sunKey = parseFrenchDate(Number(m[4]), m[5]!, Number(m[6]!));
  if (!satKey || !sunKey) return null;

  return {
    saturdayKey: satKey,
    sundayKey: sunKey,
    label: `Samedi ${m[1]} ${m[2]} / Dimanche ${m[4]} ${m[5]} ${m[6]}`,
  };
}

export function isCoppfDocumentValidForDate(
  weekend: { saturdayKey: string; sundayKey: string },
  now: Date,
): boolean {
  const key = now.toLocaleDateString("en-CA", { timeZone: TZ });
  return key === weekend.saturdayKey || key === weekend.sundayKey;
}

function formatPfPhone(digits: string): { phone: string; phoneHref: string } | null {
  let d = digits.replace(/\D/g, "");
  if (d.startsWith("689") && d.length >= 11) d = d.slice(3);
  if (d.length < 8) return null;
  d = d.slice(-8);
  const phone = `${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
  return { phone, phoneHref: `tel:+689${d}` };
}

function extractPhoneNearMoorea(block: string): { phone: string; phoneHref: string } | null {
  const mooreaLine = block.match(/Moorea\s+([\d\s/.]+?)(?:\s|$)/i);
  if (mooreaLine?.[1]) {
    const formatted = formatPfPhone(mooreaLine[1]);
    if (formatted) return formatted;
  }

  const pf = block.match(/(?:^|\s)((?:40|87|89)\s*[\d\s]{5,}(?:\s*\/\s*(?:40|87|89)\s*[\d\s]{5,})?)/);
  if (pf?.[1]) {
    const first = pf[1].split("/")[0]!.trim();
    const formatted = formatPfPhone(first);
    if (formatted) return formatted;
  }

  return null;
}

function extractDoctorBeforeMoorea(before: string): string | null {
  const matches = [
    ...before.matchAll(
      /Dr\.?\s+([A-ZÀ-Ü][A-Za-zÀ-ü'`-]+(?:\s+[A-ZÀ-Ü][A-Za-zÀ-ü'`-]+)*)/g,
    ),
  ];
  if (matches.length === 0) return null;
  const name = matches[matches.length - 1]![1]!.trim().replace(/\s+/g, " ");
  return name.startsWith("Dr") ? name : `Dr ${name}`;
}

/**
 * Extrait le médecin de garde Moorea depuis le texte OCR complet.
 */
export function parseMooreaDoctorFromCoppfOcr(
  rawText: string,
  now = new Date(),
): CoppfMooreaOcrResult | null {
  const text = normalizeOcrText(rawText);
  const weekend = parseCoppfWeekendDates(text);
  if (!weekend || !isCoppfDocumentValidForDate(weekend, now)) return null;

  const mooreaIdx = text.search(/\bMoorea\b/i);
  if (mooreaIdx === -1) return null;

  const before = text.slice(Math.max(0, mooreaIdx - 280), mooreaIdx);
  const afterEnd = text.slice(mooreaIdx).search(SECTOR_AFTER_MOOREA);
  const after = text.slice(
    mooreaIdx,
    afterEnd > 0 ? mooreaIdx + afterEnd : mooreaIdx + 220,
  );
  const block = `${before} ${after}`;

  const doctorName = extractDoctorBeforeMoorea(before);
  const phoneInfo = extractPhoneNearMoorea(after);
  if (!doctorName || !phoneInfo) return null;

  return {
    doctorName,
    phone: phoneInfo.phone,
    phoneHref: phoneInfo.phoneHref,
    weekendLabel: weekend.label,
    validFrom: weekend.saturdayKey,
    validTo: weekend.sundayKey,
  };
}
