/** Médecin ou pharmacie de garde identifié(e) pour Moorea. */
export type OnCallDuty = {
  name: string;
  phone: string;
  phoneHref: string;
  address?: string;
  source: string;
  sourceUrl?: string;
};

export type DspContact = {
  label: string;
  phone: string;
  phoneHref: string;
};

export type HealthOnCallData = {
  generatedAt: string;
  showProminent: boolean;
  periodLabel: string;
  holidayLabel: string | null;
  weekendLabel: string | null;
  onDutyPharmacy: OnCallDuty | null;
  onDutyDoctor: OnCallDuty | null;
  dspContacts: DspContact[];
  sources: { label: string; href: string }[];
  posterImageUrl?: string | null;
  articleHref?: string | null;
};
