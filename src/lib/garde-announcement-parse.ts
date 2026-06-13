/**
 * Extraction médecin / pharmacie de garde depuis annonces (Facebook commune…).
 */

import { MOOREA_PHARMACIES, type MooreaPharmacy } from "@/lib/moorea-pharmacies";

export type ParsedOnCall = {
  name: string;
  phone: string;
  phoneHref: string;
};

export type ParsedGardeWeekend = {
  validFrom: string;
  validTo: string;
  label: string;
  doctor: ParsedOnCall | null;
  pharmacy: ParsedOnCall | null;
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

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 6) return `tel:+689${digits.slice(-8)}`;
  return "";
}

function cleanPhone(raw: string): string {
  return raw.replace(/\./g, " ").replace(/\s+/g, " ").trim();
}

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseWeekendDatesFromText(text: string): {
  validFrom: string;
  validTo: string;
  label: string;
} | null {
  const n = stripAccents(text);

  const range = n.match(
    /samedi\s+(\d{1,2})(?:\s+\w+)?\s*(?:et|\/|au|-)\s*dimanche\s+(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i,
  );
  if (range) {
    const year = range[4] ? Number(range[4]) : new Date().getFullYear();
    const month = FRENCH_MONTHS[stripAccents(range[3]!)];
    if (!month) return null;
    return {
      validFrom: dateKey(year, month, Number(range[1])),
      validTo: dateKey(year, month, Number(range[2])),
      label: `Samedi ${range[1]} / Dimanche ${range[2]} ${range[3]} ${year}`,
    };
  }

  const coppfRange = n.match(
    /samedi\s+(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?\s*(?:\/|et|au|-)\s*dimanche\s+(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i,
  );
  if (coppfRange) {
    const year = Number(coppfRange[3] ?? coppfRange[6] ?? new Date().getFullYear());
    const month = FRENCH_MONTHS[stripAccents(coppfRange[2]!)];
    if (!month) return null;
    return {
      validFrom: dateKey(year, month, Number(coppfRange[1])),
      validTo: dateKey(year, month, Number(coppfRange[4])),
      label: `Samedi ${coppfRange[1]} / Dimanche ${coppfRange[4]} ${coppfRange[5]} ${year}`,
    };
  }

  const single = n.match(
    /(?:week[- ]?end|we)\s*(?:du|de|le)?\s*(\d{1,2})\s*(?:et|\/|au|-)\s*(\d{1,2})\s+(\w+)(?:\s+(\d{4}))?/i,
  );
  if (single) {
    const year = single[4] ? Number(single[4]) : new Date().getFullYear();
    const month = FRENCH_MONTHS[stripAccents(single[3]!)];
    if (!month) return null;
    return {
      validFrom: dateKey(year, month, Number(single[1])),
      validTo: dateKey(year, month, Number(single[2])),
      label: `Week-end ${single[1]}-${single[2]} ${single[3]} ${year}`,
    };
  }

  return null;
}

function parsePharmacyFromText(
  text: string,
  pharmacies: MooreaPharmacy[],
): ParsedOnCall | null {
  const n = stripAccents(text);
  if (!/pharmacie|garde/.test(n)) return null;

  for (const p of pharmacies) {
    const keys = [
      stripAccents(p.name),
      stripAccents(p.district),
      p.id.replace("pharmacie-", "").replace(/-/g, " "),
    ].filter((k) => k.length > 4);

    if (keys.some((k) => n.includes(k))) {
      return { name: p.name, phone: p.phone, phoneHref: p.phoneHref };
    }
  }
  if (n.includes("tran") && (n.includes("paopao") || n.includes("maharepa"))) {
    const p = pharmacies.find((x) => x.id === "pharmacie-tran-moorea");
    if (p) return { name: p.name, phone: p.phone, phoneHref: p.phoneHref };
  }
  if (n.includes("afareaitu")) {
    const p = pharmacies.find((x) => x.id === "pharmacie-moorea-afareaitu");
    if (p) return { name: p.name, phone: p.phone, phoneHref: p.phoneHref };
  }
  if (n.includes("haapiti") || n.includes("tiahura")) {
    const p = pharmacies.find((x) => x.id === "pharmacie-moorea-haapiti");
    if (p) return { name: p.name, phone: p.phone, phoneHref: p.phoneHref };
  }
  return null;
}

export type GardePharmacyHours = {
  district: string;
  phone: string;
  saturday?: string;
  sunday?: string;
};

/** Fusionne le texte OCR dans un snapshot garde existant. */
export function mergeGardeOcrIntoSnapshot<
  T extends {
    validFrom: string;
    validTo: string;
    label: string;
    doctor: ParsedOnCall | null;
    pharmacy: ParsedOnCall | null;
    doctorAddress?: string;
    doctorHours?: { saturday?: string; sunday?: string };
    pharmacyHours?: GardePharmacyHours[];
  },
>(snap: T, ocrText: string): T {
  const coppf = parseCoppfMooreaGarde(ocrText);
  const dates = parseWeekendDatesFromText(ocrText);
  const fromPoster = parseGardeFromPosterText(ocrText);
  const pharmacyHours = parsePharmacyHoursFromText(ocrText);
  const doctorHours = parseDoctorHoursFromText(ocrText);
  const doctorAddress = parseDoctorAddressFromText(ocrText);

  const mergedDates = coppf?.dates ?? dates;

  return {
    ...snap,
    ...(mergedDates ?? {}),
    doctor:
      snap.doctor?.name
        ? snap.doctor
        : coppf?.doctor ?? fromPoster.doctor ?? snap.doctor,
    pharmacy: snap.pharmacy?.name ? snap.pharmacy : fromPoster.pharmacy ?? snap.pharmacy,
    doctorAddress: snap.doctorAddress ?? doctorAddress,
    doctorHours:
      snap.doctorHours ??
      (coppf?.doctorHours.saturday || coppf?.doctorHours.sunday
        ? coppf.doctorHours
        : doctorHours),
    pharmacyHours:
      snap.pharmacyHours && snap.pharmacyHours.length > 0
        ? snap.pharmacyHours
        : pharmacyHours.length > 0
          ? pharmacyHours
          : snap.pharmacyHours,
  };
}

export function parseGardeFromPosterText(
  text: string,
  pharmacies: MooreaPharmacy[] = MOOREA_PHARMACIES,
): { doctor: ParsedOnCall | null; pharmacy: ParsedOnCall | null } {
  if (!text?.trim()) return { doctor: null, pharmacy: null };
  const n = stripAccents(text);
  if (!/garde|medecin|pharmacie|week[- ]?end|\bwe\b|docteur/.test(n)) {
    return { doctor: null, pharmacy: null };
  }
  return {
    doctor: parseDoctorFromText(text),
    pharmacy: parsePharmacyFromText(text, pharmacies),
  };
}

export function parsePharmacyHoursFromText(text: string): GardePharmacyHours[] {
  const districts = [
    { key: "afareaitu", label: "Afareaitu" },
    { key: "maharepa", label: "Maharepa" },
    { key: "haapiti", label: "Haapiti" },
    { key: "tiahura", label: "Haapiti" },
  ];
  const n = stripAccents(text);
  const results: GardePharmacyHours[] = [];

  for (const d of districts) {
    if (!n.includes(d.key)) continue;
    const idx = n.indexOf(d.key);
    const chunk = text.slice(idx, idx + 220);
    const phoneMatch = chunk.match(/(?:40|87|89)[\s.\d]{7,12}/);
    const phone = phoneMatch ? cleanPhone(phoneMatch[0]) : "";
    const sat = chunk.match(
      /samedi[^.\n]{0,40}?(\d{1,2}\s*[hH][\d\s.]{0,6}(?:\s*[\/\-–]\s*\d{1,2}\s*[hH][\d\s.]{0,6})?)/i,
    );
    const sun = chunk.match(
      /dimanche[^.\n]{0,40}?(\d{1,2}\s*[hH][\d\s.]{0,6}(?:\s*[\/\-–]\s*\d{1,2}\s*[hH][\d\s.]{0,6})?)/i,
    );
    if (phone || sat || sun) {
      results.push({
        district: d.label,
        phone,
        saturday: sat?.[1]?.trim(),
        sunday: sun?.[1]?.trim(),
      });
    }
  }

  return results;
}

export function parseDoctorHoursFromText(text: string): {
  saturday?: string;
  sunday?: string;
} {
  const sat = text.match(
    /samedi[^.\n]{0,35}?(\d{1,2}\s*[hH]\d{0,2}\s*[–\-—]\s*\d{1,2}\s*[hH]\d{0,2})/i,
  );
  const sun = text.match(
    /dimanche[^.\n]{0,35}?(\d{1,2}\s*[hH]\d{0,2}\s*[–\-—]\s*\d{1,2}\s*[hH]\d{0,2})/i,
  );
  return {
    saturday: sat?.[1]?.trim(),
    sunday: sun?.[1]?.trim(),
  };
}

export function parseDoctorAddressFromText(text: string): string | undefined {
  const m =
    text.match(/(?:temae|tumai|pk\s*[\d,.]+)[^\n.]{0,80}/i) ??
    text.match(/centre\s+tumai[^\n.]{0,60}/i);
  return m?.[0]?.trim().replace(/\s+/g, " ");
}

function parseDoctorFromText(text: string): ParsedOnCall | null {
  const n = stripAccents(text);
  if (!/medecin|docteur|dr\.| garde/.test(n)) return null;

  const dr =
    text.match(
      /(?:Dr|Docteur|Docteure|M[ée]decin)\.?\s+([A-ZÀ-Ü][A-Za-zÀ-ü'\-]+(?:[\s-][A-ZÀ-Ü][A-Za-zÀ-ü'\-]+)*)/,
    ) ??
    text.match(/(?:Dr|Docteur|Docteure|M[ée]decin)\.?\s+([^\n,;]+)/i) ??
    text.match(
      /(?:Dr|Docteur|M[ée]decin)[^\n]{0,40}?([A-Z][A-Za-z\-]+\s+[A-Z][A-Za-z\-]+(?:\s+[A-Z][A-Za-z\-]+)?)/,
    ) ??
    text.match(/\b([A-Z][a-z]{4,})\s+(Pierre|Paul|Jean|Marie|Antoine)\s+([A-Z][a-z]{4,})\b/);

  if (!dr) return null;

  const rawName = (
    dr.length >= 4 && dr[2] && dr[3]
      ? `${dr[1]} ${dr[2]} ${dr[3]}`
      : dr[1]
  )
    .trim()
    .replace(/\s+/g, " ");
  const name = rawName.match(/^Dr\.?\s/i) ? rawName : `Dr ${rawName}`;
  const phoneMatch =
    text.match(
      /(?:T[ée]l\.?|Tel\.?|☎|phone|au)\s*[:\.]?\s*((?:\+689\s*)?(?:40|87|89)\s*[\d\s\.]{6,})/i,
    ) ?? text.match(/((?:40|87|89)\s?\d{2}\s?\d{2}\s?\d{2})/);

  const phone = phoneMatch ? cleanPhone(phoneMatch[1]) : "";
  return {
    name,
    phone: phone || "—",
    phoneHref: phone ? phoneHref(phone) : "",
  };
}

export function parseGardeAnnouncement(
  text: string,
  pharmacies: MooreaPharmacy[] = MOOREA_PHARMACIES,
): { doctor: ParsedOnCall | null; pharmacy: ParsedOnCall | null } {
  if (!text?.trim()) return { doctor: null, pharmacy: null };
  const n = stripAccents(text);
  if (!/garde|astreinte|week[- ]?end|\bwe\b/.test(n)) {
    return { doctor: null, pharmacy: null };
  }

  return {
    doctor: parseDoctorFromText(text),
    pharmacy: parsePharmacyFromText(text, pharmacies),
  };
}

export function parseGardePost(
  text: string,
  postDateIso?: string,
): ParsedGardeWeekend | null {
  const parsed = parseGardeFromSiteContent(text, postDateIso, false);
  if (!parsed) return null;
  if (!parsed.doctor && !parsed.pharmacy) return null;
  return parsed;
}

/** Affiche officielle médecins généralistes (COPPF / Ordre des médecins). */
export function parseCoppfMooreaGarde(text: string): {
  dates: { validFrom: string; validTo: string; label: string };
  doctor: ParsedOnCall | null;
  doctorHours: { saturday?: string; sunday?: string };
} | null {
  const n = stripAccents(text);
  if (!/ordre des medecins|tour de garde officiel|medecins generalistes/.test(n)) {
    return null;
  }

  const dates = parseWeekendDatesFromText(text);
  if (!dates) return null;

  const doctor = parseMooreaDoctorFromCoppfText(text);
  const doctorHours = doctor
    ? parseDoctorHoursNearName(text, doctor.name.replace(/^Dr\.?\s+/i, ""))
    : {};

  return { dates, doctor, doctorHours };
}

function parseDoctorHoursNearName(text: string, namePart: string): {
  saturday?: string;
  sunday?: string;
} {
  const token = stripAccents(namePart).split(/\s+/)[0] ?? "";
  const idx = token ? stripAccents(text).indexOf(token) : -1;
  if (idx < 0) return parseDoctorHoursFromText(text);
  return parseDoctorHoursFromText(text.slice(idx, idx + 220));
}

/** Extrait le médecin de garde Moorea depuis l'OCR COPPF. */
export function parseMooreaDoctorFromCoppfText(text: string): ParsedOnCall | null {
  const n = stripAccents(text);

  const mooreaBlock = text.match(/(?:ile\s+)?moorea[\s-]*maiao?[\s\S]{0,320}/i);
  if (mooreaBlock) {
    const d = parseDoctorFromText(mooreaBlock[0]);
    if (isPlausibleDoctor(d)) return d;
  }

  const sectorRe = /(?:secteur|ile|presqu.?ile|commune)\s[^\n]{0,70}/gi;
  let match: RegExpExecArray | null;
  while ((match = sectorRe.exec(text)) !== null) {
    const sector = stripAccents(match[0]);
    if (!/moorea|maiao/.test(sector)) continue;
    const block = text.slice(match.index, match.index + 320);
    const d = parseDoctorFromText(block);
    if (isPlausibleDoctor(d)) return d;
  }

  const fougerouse = text.match(
    /(?:Dr\s+)?(?:FOUGEROUSE|Fougerouse)[^\n]{0,120}?((?:87|40)\s?[\d\s]{7,12})/i,
  );
  if (fougerouse) {
    const phone = cleanPhone(fougerouse[1]!);
    return {
      name: "Dr Fougerouse Pierre Antoine",
      phone: phone || "—",
      phoneHref: phone ? phoneHref(phone) : "",
    };
  }

  const appietto = text.match(
    /Dr\s+APPIETTO\s+Audrey[\s\S]{0,90}?((?:40|87)\s?[\d\s]{7,12})/i,
  );
  if (appietto) {
    const phone = cleanPhone(appietto[1]!);
    return {
      name: "Dr APPIETTO Audrey",
      phone: phone || "—",
      phoneHref: phone ? phoneHref(phone) : "",
    };
  }

  if (/moorea|maiao/.test(n)) {
    const d = parseDoctorFromText(text);
    if (isPlausibleDoctor(d)) return d;
  }

  return null;
}

function isPlausibleDoctor(entry: ParsedOnCall | null): boolean {
  if (!entry?.name?.trim()) return false;
  const name = entry.name.trim();
  if (name.length > 48) return false;
  if (/service essentiel|continuit[eé] des soins|horaires habituels|disposition/i.test(name)) {
    return false;
  }
  return true;
}

/** Post / article Facebook déjà importé — accepte affiche seule + dates déduites. */
export function parseGardeFromSiteContent(
  text: string,
  postDateIso?: string,
  hasCover = false,
): ParsedGardeWeekend | null {
  const parsed = parseGardeAnnouncement(text);
  let dates = parseWeekendDatesFromText(text);
  if (!dates && postDateIso) {
    dates = inferWeekendFromPostDate(postDateIso);
  }

  const doctor = isPlausibleDoctor(parsed.doctor) ? parsed.doctor : null;
  const pharmacy = parsed.pharmacy;

  if (doctor || pharmacy) {
    if (!dates) return null;
    return {
      ...dates,
      doctor,
      pharmacy,
    };
  }

  const n = stripAccents(text);
  if (!/garde|medecin|pharmacie|week[- ]?end|\bwe\b|docteur/.test(n)) {
    return null;
  }

  if (!dates) return null;

  if (
    hasCover ||
    /medecin de garde|pharmacie de garde|pharmacies de garde/.test(n)
  ) {
    return {
      ...dates,
      doctor: null,
      pharmacy: null,
    };
  }

  return null;
}

export function isGardeImagePost(
  message: string,
  postDateIso?: string,
  hasPicture?: boolean,
): boolean {
  if (!hasPicture || !postDateIso) return false;

  const msg = message?.trim() ?? "";
  if (msg) {
    const parsed = parseGardeAnnouncement(msg);
    if (parsed.doctor || parsed.pharmacy) return true;
    const n = stripAccents(msg);
    if (/garde|medecin|pharmacie|week[- ]?end|\bwe\b/.test(n)) return true;
  }

  const post = new Date(postDateIso);
  if (Number.isNaN(post.getTime())) return false;
  const key = post.toLocaleDateString("en-CA", { timeZone: "Pacific/Tahiti" });
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = utc.getUTCDay();
  return dow === 4 || dow === 5 || dow === 6;
}

export function inferWeekendFromPostDate(postDateIso: string): {
  validFrom: string;
  validTo: string;
  label: string;
} | null {
  const post = new Date(postDateIso);
  if (Number.isNaN(post.getTime())) return null;

  const key = post.toLocaleDateString("en-CA", { timeZone: "Pacific/Tahiti" });
  const [y, m, d] = key.split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = utc.getUTCDay();

  let sat: Date;
  if (dow === 4) sat = new Date(Date.UTC(y!, m! - 1, d! + 2));
  else if (dow === 5) sat = new Date(Date.UTC(y!, m! - 1, d! + 1));
  else if (dow === 6) sat = utc;
  else if (dow === 0) sat = new Date(Date.UTC(y!, m! - 1, d! - 1));
  else return null;

  const sun = new Date(sat);
  sun.setUTCDate(sat.getUTCDate() + 1);

  const validFrom = sat.toISOString().slice(0, 10);
  const validTo = sun.toISOString().slice(0, 10);
  return { validFrom, validTo, label: `Week-end ${validFrom} → ${validTo}` };
}
