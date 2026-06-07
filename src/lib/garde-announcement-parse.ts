/**
 * Extraction médecin / pharmacie de garde depuis un texte d’annonce (commune, Facebook…).
 */

import type { MooreaPharmacy } from "@/lib/health-on-call-shared";

export type ParsedOnCall = {
  name: string;
  phone: string;
  phoneHref: string;
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 6) return `tel:+689${digits}`;
  return `tel:${phone}`;
}

function cleanPhone(raw: string): string {
  return raw.replace(/\./g, " ").replace(/\s+/g, " ").trim();
}

function parsePharmacyFromText(
  text: string,
  pharmacies: MooreaPharmacy[],
): ParsedOnCall | null {
  const n = normalize(text);
  if (!/pharmacie|garde/.test(n)) return null;

  for (const p of pharmacies) {
    const keys = [
      normalize(p.name),
      normalize(p.district),
      p.id.replace("pharmacie-", "").replace(/-/g, " "),
    ].filter((k) => k.length > 4);

    if (keys.some((k) => n.includes(k))) {
      return { name: p.name, phone: p.phone, phoneHref: p.phoneHref };
    }
  }
  if (n.includes("tran") && n.includes("paopao")) {
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
  const n = normalize(text);
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
  pharmacies: MooreaPharmacy[],
): { doctor: ParsedOnCall | null; pharmacy: ParsedOnCall | null } {
  if (!text?.trim()) return { doctor: null, pharmacy: null };
  const n = normalize(text);
  if (!/garde|astreinte/.test(n)) return { doctor: null, pharmacy: null };

  return {
    doctor: parseDoctorFromText(text),
    pharmacy: parsePharmacyFromText(text, pharmacies),
  };
}

export function pharmacyToOnCall(p: MooreaPharmacy): ParsedOnCall {
  return { name: p.name, phone: p.phone, phoneHref: p.phoneHref };
}
