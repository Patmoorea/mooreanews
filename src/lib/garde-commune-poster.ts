/**
 * Affiche hebdomadaire « Médecin de garde — Moorea » de la Commune de Moorea-Maiao
 * (publiée sur https://www.facebook.com/CommuneMooreaMaiao).
 *
 * Parse le texte OCR de l'affiche : médecin, jours / horaires, lieu, téléphone
 * et horaires des 3 pharmacies (Afareaitu, Maharepa, Haapiti).
 */

import type { GardePharmacyHours, ParsedOnCall } from "@/lib/garde-announcement-parse";

export type CommuneGardePoster = {
  doctor: ParsedOnCall;
  doctorAddress?: string;
  doctorHours: { saturday?: string; sunday?: string };
  /** Jours lus sur l'affiche, ex. « Samedi 17 octobre ». */
  days: { saturday?: string; sunday?: string };
  pharmacyHours: GardePharmacyHours[];
};

const PHONE_RE = /\b((?:40|87|89)(?:[ .\-]?\d{2}){3})\b/;
const RANGE_RE = /(\d{1,2})\s*[hH]\s*(\d{2})?\s*[–\-—à]+\s*(\d{1,2})\s*[hH]\s*(\d{2})?/g;

function strip(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function fmtPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(-8);
  return d.match(/\d{2}/g)?.join(" ") ?? raw.trim();
}

export function phoneToHref(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length >= 8 ? `tel:+689${d.slice(-8)}` : "";
}

function ranges(chunk: string): string[] {
  const out: string[] = [];
  for (const m of chunk.matchAll(RANGE_RE)) {
    out.push(`${Number(m[1])}h${m[2] ?? "00"} – ${Number(m[3])}h${m[4] ?? "00"}`);
  }
  return out;
}

/** Affiche commune (et pas le tableau COPPF de toute la Polynésie) ? */
export function isCommuneGardePosterText(text: string): boolean {
  const n = strip(text);
  return (
    /medecin\s+de\s+garde/.test(n) &&
    /moorea/.test(n) &&
    /pharmacie/.test(n) &&
    !/tour de garde officiel|bora[\s-]*bora|raiatea/.test(n)
  );
}

const PHARMACIES = [
  { key: /afareaitu/, label: "Afareaitu" },
  { key: /maharepa/, label: "Maharepa" },
  { key: /haapiti(?!\s*\n?\s*pk)/, label: "Haapiti" },
];

export function parseCommuneGardePosterText(text: string): CommuneGardePoster | null {
  if (!isCommuneGardePosterText(text)) return null;
  const n = strip(text);

  const pharmaStart = n.search(/horaires\s+des\s+pharmacies|pharmacie\s+d/);
  const doctorPart = pharmaStart > 0 ? text.slice(0, pharmaStart) : text;
  const pharmaPart = pharmaStart > 0 ? text.slice(pharmaStart) : "";

  const nameM = doctorPart.match(
    /Dr\.?\s+([A-ZÀ-Ü][A-ZÀ-Ü'\-]+(?:\s+[A-ZÀ-Ü][A-ZÀ-Ü'\-]+)*(?:\s+[A-ZÀ-Ü][a-zà-ü'\-]+)?)/,
  );
  if (!nameM) return null;
  const name = `Dr ${nameM[1]!.replace(/\s+/g, " ").trim()}`;

  const dn = strip(doctorPart);
  const satIdx = dn.search(/samedi/);
  const sunIdx = dn.search(/dimanche/);
  const satChunk = satIdx >= 0 ? doctorPart.slice(satIdx, sunIdx > satIdx ? sunIdx : satIdx + 80) : "";
  const sunChunk = sunIdx >= 0 ? doctorPart.slice(sunIdx, sunIdx + 80) : "";
  const dayLabel = (chunk: string) =>
    chunk.match(/^(samedi|dimanche)\s+\d{1,2}\s+[a-zéû]+/i)?.[0]?.replace(/\s+/g, " ");

  const placeM = doctorPart.match(
    /\b(HAAPITI|AFAREAITU|MAHAREPA|PAOPAO|PAPETOAI|TIAHURA|VAIARE|TEMAE|MAATEA|HAUru)\b\s*\n?\s*(PK\s*[\d,.]+[^\n]{0,30})?/i,
  );
  const doctorAddress = placeM
    ? [placeM[1]![0]!.toUpperCase() + placeM[1]!.slice(1).toLowerCase(), placeM[2]?.trim()]
        .filter(Boolean)
        .join(", ")
    : undefined;

  // Téléphone médecin = dernier numéro de la partie médecin (après le lieu).
  const docPhones = [...doctorPart.matchAll(new RegExp(PHONE_RE, "g"))].map((m) => m[1]!);
  const docPhone = docPhones.length ? fmtPhone(docPhones[docPhones.length - 1]!) : "—";

  const pharmacyHours: GardePharmacyHours[] = [];
  const pn = strip(pharmaPart);
  const starts = PHARMACIES.map((p) => ({ ...p, idx: pn.search(p.key) }))
    .filter((p) => p.idx >= 0)
    .sort((a, b) => a.idx - b.idx);
  starts.forEach((p, i) => {
    const chunk = pharmaPart.slice(p.idx, starts[i + 1]?.idx ?? pharmaPart.length);
    const c = strip(chunk);
    const phoneM = chunk.match(PHONE_RE);
    const sIdx = c.search(/samedi/);
    const dIdx = c.search(/dimanche/);
    const sat = sIdx >= 0 ? ranges(chunk.slice(sIdx, dIdx > sIdx ? dIdx : undefined)) : [];
    const sun = dIdx >= 0 ? ranges(chunk.slice(dIdx)) : [];
    pharmacyHours.push({
      district: p.label,
      phone: phoneM ? fmtPhone(phoneM[1]!) : "",
      saturday: sat.length ? sat.join(" et ") : undefined,
      sunday: sun.length ? sun.join(" et ") : undefined,
    });
  });

  return {
    doctor: { name, phone: docPhone, phoneHref: docPhone === "—" ? "" : phoneToHref(docPhone) },
    doctorAddress,
    doctorHours: { saturday: ranges(satChunk)[0], sunday: ranges(sunChunk)[0] },
    days: { saturday: dayLabel(satChunk), sunday: dayLabel(sunChunk) },
    pharmacyHours,
  };
}
