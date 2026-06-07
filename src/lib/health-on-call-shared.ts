export type MooreaPharmacy = {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  phoneHref: string;
  hoursNote: string;
  satOpen?: [number, number];
  sunOpen?: [number, number];
};

/** Médecin ou pharmacie de garde identifié(e) pour Moorea. */
export type OnCallDuty = {
  name: string;
  phone: string;
  phoneHref: string;
  address?: string;
  source: string;
  sourceUrl?: string;
};

export type GuardScheduleImage = {
  label: string;
  imageUrl: string;
  sourceName: string;
  sourceUrl: string;
  updatedAt: string | null;
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
  /** Pharmacie de garde Moorea (si connue). */
  onDutyPharmacy: OnCallDuty | null;
  /** Médecin de garde Moorea (si connu). */
  onDutyDoctor: OnCallDuty | null;
  /** Planning officiel COPPF — secours si le nom du médecin n’est pas publié en texte. */
  officialDoctorSchedule: GuardScheduleImage | null;
  dspContacts: DspContact[];
  sources: { label: string; href: string }[];
};
