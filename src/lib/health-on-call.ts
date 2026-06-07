/**
 * Pharmacies et médecins de garde — Moorea uniquement (pas d’annuaire).
 */

import {
  COPPF_SOURCES,
  fetchCoppfDoctorSchedule,
} from "@/lib/coppf-guard-schedule";
import { listCommuneMooreaGraphPosts } from "@/lib/facebook-watch";
import {
  parseGardeAnnouncement,
  pharmacyToOnCall,
} from "@/lib/garde-announcement-parse";
import {
  formatTahitiDay,
  isHealthOnCallPeriod,
  isTahitiPublicHoliday,
  tahitiDateKey,
  tahitiHolidayLabel,
  tahitiParts,
} from "@/lib/tahiti-holidays";
import type {
  HealthOnCallData,
  MooreaPharmacy,
  OnCallDuty,
} from "@/lib/health-on-call-shared";

export type {
  HealthOnCallData,
  MooreaPharmacy,
  OnCallDuty,
} from "@/lib/health-on-call-shared";

const TZ = "Pacific/Tahiti";
const COMMUNE_FB = "https://www.facebook.com/CommuneMooreaMaiao";

const DSP_GARDE_PHONES = [
  { label: "Direction de la santé", phone: "40 47 01 44", phoneHref: "tel:+68940470144" },
  { label: "Direction de la santé", phone: "40 47 01 47", phoneHref: "tel:+68940470147" },
] as const;

export const MOOREA_PHARMACIES: MooreaPharmacy[] = [
  {
    id: "pharmacie-moorea-afareaitu",
    name: "Pharmacie Moorea-Afareaitu",
    district: "Afareaitu",
    address: "PK 8,7 côté montagne, Afareaitu",
    phone: "40 56 35 47",
    phoneHref: "tel:+68940563547",
    hoursNote: "Lun–ven 6h30–18h30 · sam 7h30–13h30 · dim & fériés 7h30–11h30",
    satOpen: [7 * 60 + 30, 13 * 60 + 30],
    sunOpen: [7 * 60 + 30, 11 * 60 + 30],
  },
  {
    id: "pharmacie-tran-moorea",
    name: "Pharmacie Tran",
    district: "Paopao",
    address: "PK 6,5, Paopao",
    phone: "40 55 20 75",
    phoneHref: "tel:+68940552075",
    hoursNote: "Lun–ven 7h–18h · sam 7h–12h30",
    satOpen: [7 * 60, 12 * 60 + 30],
  },
  {
    id: "pharmacie-moorea-haapiti",
    name: "Pharmacie Moorea Haapiti",
    district: "Tiahura",
    address: "Tiahura, Haapiti",
    phone: "40 56 41 16",
    phoneHref: "tel:+68940564116",
    hoursNote: "Lun–ven 7h–18h · sam 7h–12h30",
    satOpen: [7 * 60, 12 * 60 + 30],
  },
];

const CACHE_MS = 6 * 60 * 60 * 1000;
let cache: { at: number; data: HealthOnCallData } | null = null;

function pharmaciesOpenToday(d: Date): MooreaPharmacy[] {
  const { dow } = tahitiParts(d);
  const isSunOrHoliday = dow === 0 || isTahitiPublicHoliday(d);
  const isSat = dow === 6;
  return MOOREA_PHARMACIES.filter((p) => {
    if (isSat && p.satOpen) return true;
    if (isSunOrHoliday && p.sunOpen) return true;
    return false;
  });
}

function parseOnDutyPharmacyFromEnv(): MooreaPharmacy | null {
  const raw = process.env.HEALTH_ON_CALL_PHARMACY_ID?.trim();
  if (!raw) return null;
  return MOOREA_PHARMACIES.find((p) => p.id === raw) ?? null;
}

function parseOnDutyDoctorFromEnv(): OnCallDuty | null {
  const name = process.env.HEALTH_ON_CALL_DOCTOR_NAME?.trim();
  const phone = process.env.HEALTH_ON_CALL_DOCTOR_PHONE?.trim();
  if (!name) return null;
  const digits = phone?.replace(/\D/g, "") ?? "";
  return {
    name: name.startsWith("Dr") ? name : `Dr ${name}`,
    phone: phone ?? "—",
    phoneHref: digits ? `tel:+689${digits}` : "",
    source: "Configuration MooreaNews",
  };
}

function toPharmacyDuty(p: MooreaPharmacy, source: string, sourceUrl?: string): OnCallDuty {
  const o = pharmacyToOnCall(p);
  return {
    name: o.name,
    phone: o.phone,
    phoneHref: o.phoneHref,
    address: p.address,
    source,
    sourceUrl,
  };
}

function toDoctorDuty(
  parsed: { name: string; phone: string; phoneHref: string },
  source: string,
  sourceUrl?: string,
): OnCallDuty {
  return {
    name: parsed.name,
    phone: parsed.phone,
    phoneHref: parsed.phoneHref,
    source,
    sourceUrl,
  };
}

async function fetchCommuneRssGarde(): Promise<{
  doctor: OnCallDuty | null;
  pharmacy: OnCallDuty | null;
} | null> {
  try {
    const res = await fetch("https://www.commune-moorea.net/feed/", {
      headers: { Accept: "application/rss+xml" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const xml = await res.text();
    for (const item of xml.split("<item>").slice(1, 30)) {
      const titleM = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
      const descM = item.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
      const linkM = item.match(/<link>([\s\S]*?)<\/link>/);
      const text = `${titleM?.[1] ?? ""} ${descM?.[1] ?? ""}`;
      const parsed = parseGardeAnnouncement(text, MOOREA_PHARMACIES);
      if (!parsed.doctor && !parsed.pharmacy) continue;
      const url = linkM?.[1]?.trim();
      return {
        doctor: parsed.doctor
          ? toDoctorDuty(parsed.doctor, "Commune de Moorea-Maiao", url)
          : null,
        pharmacy: parsed.pharmacy
          ? (() => {
              const p = MOOREA_PHARMACIES.find((x) => x.name === parsed.pharmacy!.name);
              return p
                ? toPharmacyDuty(p, "Commune de Moorea-Maiao", url)
                : toDoctorDuty(
                    { ...parsed.pharmacy, phoneHref: parsed.pharmacy.phoneHref || "" },
                    "Commune de Moorea-Maiao",
                    url,
                  );
            })()
          : null,
      };
    }
  } catch {
    /* optionnel */
  }
  return null;
}

async function fetchCommuneFacebookGarde(): Promise<{
  doctor: OnCallDuty | null;
  pharmacy: OnCallDuty | null;
} | null> {
  try {
    const posts = await listCommuneMooreaGraphPosts();
    const cutoff = Date.now() - 14 * 86400000;
    for (const post of posts) {
      const t = Date.parse(post.created_time ?? "");
      if (t && t < cutoff) continue;
      const msg = post.message ?? "";
      const parsed = parseGardeAnnouncement(msg, MOOREA_PHARMACIES);
      if (!parsed.doctor && !parsed.pharmacy) continue;
      const url = post.permalink_url ?? COMMUNE_FB;
      return {
        doctor: parsed.doctor
          ? toDoctorDuty(parsed.doctor, "Commune Moorea-Maiao (Facebook)", url)
          : null,
        pharmacy: parsed.pharmacy
          ? (() => {
              const p = MOOREA_PHARMACIES.find((x) => x.name === parsed.pharmacy!.name);
              if (!p) {
                return {
                  name: parsed.pharmacy.name,
                  phone: parsed.pharmacy.phone,
                  phoneHref: parsed.pharmacy.phoneHref,
                  source: "Commune Moorea-Maiao (Facebook)",
                  sourceUrl: url,
                };
              }
              return toPharmacyDuty(p, "Commune Moorea-Maiao (Facebook)", url);
            })()
          : null,
      };
    }
  } catch {
    /* Graph API optionnel */
  }
  return null;
}

function buildPeriodLabel(d: Date): string {
  const holiday = tahitiHolidayLabel(d);
  if (holiday) return `${formatTahitiDay(d)} — ${holiday}`;
  const { dow } = tahitiParts(d);
  if (dow === 5) return `Ce week-end (${formatTahitiDay(d)})`;
  return formatTahitiDay(d);
}

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function getHealthOnCall(now = new Date()): Promise<HealthOnCallData> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  const openToday = pharmaciesOpenToday(now);
  const envPharmacy = parseOnDutyPharmacyFromEnv();
  const envDoctor = parseOnDutyDoctorFromEnv();

  const [coppfDoctors, communeFb, communeRss] = await Promise.all([
    fetchCoppfDoctorSchedule(),
    fetchCommuneFacebookGarde(),
    fetchCommuneRssGarde(),
  ]);

  let onDutyPharmacy: OnCallDuty | null = null;
  let onDutyDoctor: OnCallDuty | null = null;

  if (envPharmacy) {
    onDutyPharmacy = toPharmacyDuty(envPharmacy, "Configuration MooreaNews");
  } else if (communeFb?.pharmacy) {
    onDutyPharmacy = communeFb.pharmacy;
  } else if (communeRss?.pharmacy) {
    onDutyPharmacy = communeRss.pharmacy;
  } else if (openToday.length === 1) {
    onDutyPharmacy = toPharmacyDuty(openToday[0]!, "Horaires officiels (seule ouverte)");
  }

  if (envDoctor) {
    onDutyDoctor = envDoctor;
  } else if (communeFb?.doctor) {
    onDutyDoctor = communeFb.doctor;
  } else if (communeRss?.doctor) {
    onDutyDoctor = communeRss.doctor;
  }

  const officialDoctorSchedule = coppfDoctors?.images[0]
    ? {
        label: "Planning officiel — repérez la ligne Moorea",
        imageUrl: coppfDoctors.images[0].imageUrl,
        sourceName: "Ordre des pharmaciens PF",
        sourceUrl: coppfDoctors.pageUrl,
        updatedAt: formatUpdatedAt(coppfDoctors.updatedAt),
      }
    : null;

  const data: HealthOnCallData = {
    generatedAt: now.toISOString(),
    showProminent: isHealthOnCallPeriod(now),
    periodLabel: buildPeriodLabel(now),
    holidayLabel: tahitiHolidayLabel(now),
    onDutyPharmacy,
    onDutyDoctor,
    officialDoctorSchedule: onDutyDoctor ? null : officialDoctorSchedule,
    dspContacts: [...DSP_GARDE_PHONES],
    sources: [
      { label: "DSP garde — 40 47 01 44", href: "tel:+68940470144" },
      { label: "Médecins de garde (COPPF)", href: COPPF_SOURCES.doctors },
      { label: "Commune Moorea-Maiao", href: COMMUNE_FB },
    ],
  };

  cache = { at: Date.now(), data };
  return data;
}

export function clearHealthOnCallCache(): void {
  cache = null;
}

export async function syncHealthOnCall(): Promise<{
  ok: boolean;
  pharmacy: string | null;
  doctor: string | null;
}> {
  clearHealthOnCallCache();
  const data = await getHealthOnCall();
  return {
    ok: true,
    pharmacy: data.onDutyPharmacy?.name ?? null,
    doctor: data.onDutyDoctor?.name ?? null,
  };
}
