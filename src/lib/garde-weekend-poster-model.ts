/**
 * Données d'affichage de l'affiche garde. Pas de rendu : le PNG reste dans
 * garde-weekend-poster.tsx. Les textes viennent du snapshot Ordre et du
 * fichier pharmacies, sans inventer un lieu ni une pharmacie de garde.
 */

import { MOOREA_PHARMACIES } from "@/data/pharmacies-moorea";
import {
  gardeSeasonForIsoDate,
  type GardeSeasonBand,
} from "@/data/garde-seasonal-calendar";

export const GARDE_WEEKEND_POSTER_SIZE = { width: 1080, height: 1620 } as const;

/** Change quand le gabarit change, pour que le cron réécrive une URL d'article neuve. */
export const GARDE_POSTER_REVISION = "maquette1620c";

export const GARDE_IMAGE_CREDIT = "Source médecin : tableau de l'Ordre des médecins";

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const;

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
] as const;

export type GardePosterInput = {
  validFrom: string;
  validTo: string;
  doctor?: { name?: string; phone?: string } | null;
  doctorAddress?: string | null;
  doctorHours?: { saturday?: string; sunday?: string } | null;
  pharmacyDuty?: {
    pharmacyId: string;
    validFrom: string;
    validTo: string;
    sourceLabel?: string;
  } | null;
};

export type GardeDateColumn = {
  days: string[];
  month: string;
};

export type GardeHourRow = {
  label: string;
  hours: string;
};

export type GardePosterDayCard = {
  /** Ex. « Samedi 17 octobre ». */
  label: string;
  hours: string;
};

export type GardePosterPharmacyRow = {
  id: string;
  name: string;
  phone: string;
  saturday: string;
  sunday: string;
  onDuty: boolean;
};

function cap(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function monthName(iso: string): string {
  const month = Number(iso.slice(5, 7));
  return MONTHS[month - 1] ?? "";
}

function dayNumber(iso: string): string {
  return String(Number(iso.slice(8, 10)));
}

function weekdayName(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  return cap(WEEKDAYS[date.getUTCDay()] ?? "");
}

export function gardeDateColumn(validFrom: string, validTo: string): GardeDateColumn {
  const sameDay = validFrom === validTo;
  const fromMonth = monthName(validFrom);
  const toMonth = monthName(validTo);
  return {
    days: sameDay ? [dayNumber(validFrom)] : [dayNumber(validFrom), dayNumber(validTo)],
    month: sameDay || fromMonth === toMonth ? fromMonth : `${fromMonth} / ${toMonth}`,
  };
}

function dayCard(iso: string, hours: string | undefined): GardePosterDayCard {
  return {
    label: `${weekdayName(iso)} ${dayNumber(iso)} ${monthName(iso)}`,
    hours: hours?.trim() ?? "",
  };
}

/** Deux cartes samedi / dimanche, ou une seule si la garde tient sur un jour. */
export function gardePosterDayCards(snap: GardePosterInput): GardePosterDayCard[] {
  if (snap.validFrom === snap.validTo) {
    return [dayCard(snap.validFrom, snap.doctorHours?.saturday || snap.doctorHours?.sunday)];
  }
  return [
    dayCard(snap.validFrom, snap.doctorHours?.saturday),
    dayCard(snap.validTo, snap.doctorHours?.sunday),
  ];
}

export function gardeHourRows(snap: GardePosterInput): GardeHourRow[] {
  const saturday = snap.doctorHours?.saturday?.trim();
  const sunday = snap.doctorHours?.sunday?.trim();
  if (snap.validFrom === snap.validTo) {
    const hours = saturday || sunday;
    return hours ? [{ label: weekdayName(snap.validFrom), hours }] : [];
  }
  const rows: GardeHourRow[] = [];
  if (saturday) rows.push({ label: "Samedi", hours: saturday });
  if (sunday) rows.push({ label: "Dimanche", hours: sunday });
  return rows;
}

export function gardePosterDoctorName(name: string | undefined | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "Médecin non communiqué";
  return `Dr ${trimmed.replace(/^Dr\.?\s+/i, "")}`;
}

/** Lieu seulement s'il est déjà dans le snapshot (le tableau l'a donné). */
export function gardePosterLocation(snap: GardePosterInput): string | null {
  const location = snap.doctorAddress?.trim();
  return location ? location : null;
}

export function gardePosterPhone(snap: GardePosterInput): string | null {
  const phone = snap.doctor?.phone?.trim();
  if (!phone || phone === "—") return null;
  return phone;
}

/** Badge seulement si la pharmacie de garde cite ce samedi et ce dimanche. */
export function gardeOnDutyPharmacyId(snap: GardePosterInput): string | null {
  const duty = snap.pharmacyDuty;
  if (!duty?.pharmacyId) return null;
  if (duty.validFrom !== snap.validFrom || duty.validTo !== snap.validTo) return null;
  if (!MOOREA_PHARMACIES.some((pharmacy) => pharmacy.id === duty.pharmacyId)) return null;
  return duty.pharmacyId;
}

const POSTER_PHARMACY_NAMES: Record<string, string> = {
  "pharmacie-moorea-afareaitu": "Pharmacie d'Afareaitu",
  "pharmacie-tran-moorea": "Pharmacie Tran (Paopao)",
  "pharmacie-moorea-haapiti": "Pharmacie de Haapiti",
};

export function gardePharmacyRows(snap: GardePosterInput): GardePosterPharmacyRow[] {
  const onDutyId = gardeOnDutyPharmacyId(snap);
  return MOOREA_PHARMACIES.map((pharmacy) => ({
    id: pharmacy.id,
    name: POSTER_PHARMACY_NAMES[pharmacy.id] ?? pharmacy.name,
    phone: pharmacy.phone,
    saturday: pharmacy.saturdayUnconfirmed
      ? `${pharmacy.saturday} (à confirmer)`
      : pharmacy.saturday,
    sunday: pharmacy.sunday,
    onDuty: pharmacy.id === onDutyId,
  }));
}

export function gardePosterSeason(validFrom: string): GardeSeasonBand {
  return gardeSeasonForIsoDate(validFrom);
}

export function gardePosterDutySource(snap: GardePosterInput): string | null {
  if (!gardeOnDutyPharmacyId(snap)) return null;
  const source = snap.pharmacyDuty?.sourceLabel?.trim();
  return source || null;
}
