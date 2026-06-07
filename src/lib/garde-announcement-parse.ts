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

function parseDoctorFromText(text: string): ParsedOnCall | null {
  const n = stripAccents(text);
  if (!/medecin|docteur|dr\.| garde/.test(n)) return null;

  const dr =
    text.match(
      /(?:Dr|Docteur|Docteure|M[ée]decin)\.?\s+([A-ZÀ-Ü][A-Za-zÀ-ü'\-]+(?:[\s-][A-ZÀ-Ü][A-Za-zÀ-ü'\-]+)*)/,
    ) ??
    text.match(/(?:Dr|Docteur|Docteure|M[ée]decin)\.?\s+([^\n,;]+)/i);

  if (!dr) return null;

  const name = `Dr ${dr[1].trim().replace(/\s+/g, " ")}`;
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
  const parsed = parseGardeAnnouncement(text);
  if (!parsed.doctor && !parsed.pharmacy) return null;

  let dates = parseWeekendDatesFromText(text);
  if (!dates && postDateIso) {
    dates = inferWeekendFromPostDate(postDateIso);
  }
  if (!dates) return null;

  return {
    ...dates,
    doctor: parsed.doctor,
    pharmacy: parsed.pharmacy,
  };
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
