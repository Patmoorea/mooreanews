/**
 * Jours fériés de Polynésie française (Pacific/Tahiti).
 * Article Lp. 3223-1 du code du travail, liste de l'arrêté
 * HC 613 DIRAJ/BAJC/bt du 7 novembre 2025 et du calendrier 2026
 * service-public.pf : le 29 juin n'est plus férié ; le 5 mars,
 * le Vendredi saint, le lundi de Pâques, le 15 août et le 20 novembre
 * (Matari'i) le sont. Le dimanche de Pâques n'est pas férié.
 */

const TZ = "Pacific/Tahiti";

const FIXED: { month: number; day: number; label: string }[] = [
  { month: 1, day: 1, label: "Jour de l'an" },
  { month: 3, day: 5, label: "Arrivée de l'Évangile" },
  { month: 5, day: 1, label: "Fête du travail" },
  { month: 5, day: 8, label: "Victoire 1945" },
  { month: 7, day: 14, label: "Fête nationale" },
  { month: 8, day: 15, label: "Assomption" },
  { month: 11, day: 1, label: "Toussaint" },
  { month: 11, day: 11, label: "Armistice" },
  { month: 11, day: 20, label: "Matari'i" },
  { month: 12, day: 25, label: "Noël" },
];

export function tahitiParts(d: Date): { y: number; m: number; day: number; dow: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  const dowMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    day: Number(get("day")),
    dow: dowMap[weekday] ?? 0,
  };
}

/** Dimanche de Pâques (calendrier grégorien). */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(y: number, m: number, d: number, delta: number): { month: number; day: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return { month: dt.getUTCMonth() + 1, day: dt.getUTCDate() };
}

export function tahitiPublicHolidays(year: number): { month: number; day: number; label: string }[] {
  const easter = easterSunday(year);
  const goodFriday = addDays(year, easter.month, easter.day, -2);
  const easterMonday = addDays(year, easter.month, easter.day, 1);
  const ascension = addDays(year, easter.month, easter.day, 39);
  const pentecote = addDays(year, easter.month, easter.day, 50);

  return [
    ...FIXED,
    { month: goodFriday.month, day: goodFriday.day, label: "Vendredi saint" },
    { month: easterMonday.month, day: easterMonday.day, label: "Lundi de Pâques" },
    { month: ascension.month, day: ascension.day, label: "Ascension" },
    { month: pentecote.month, day: pentecote.day, label: "Lundi de Pentecôte" },
  ];
}

export function isTahitiPublicHoliday(d = new Date()): boolean {
  const { y, m, day } = tahitiParts(d);
  return tahitiPublicHolidays(y).some((h) => h.month === m && h.day === day);
}

export function tahitiHolidayLabel(d = new Date()): string | null {
  const { y, m, day } = tahitiParts(d);
  return tahitiPublicHolidays(y).find((h) => h.month === m && h.day === day)?.label ?? null;
}

function isoAddDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) + days));
  return dt.toISOString().slice(0, 10);
}

/** Jour férié un lundi–vendredi (un dimanche férié reste dans le week-end). */
export function isWeekdayPublicHolidayIso(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(`${iso}T12:00:00-10:00`);
  const { dow } = tahitiParts(d);
  if (dow === 0 || dow === 6) return false;
  return tahitiHolidayLabel(d) != null;
}

/**
 * Prochain jour férié en semaine, aujourd'hui ou dans les 2 jours
 * (même fenêtre que la veille du week-end).
 */
export function upcomingWeekdayHoliday(
  now = new Date(),
): { validFrom: string; validTo: string } | null {
  const today = tahitiDateKey(now);
  for (let delta = 0; delta <= 2; delta += 1) {
    const iso = isoAddDays(today, delta);
    if (isWeekdayPublicHolidayIso(iso)) return { validFrom: iso, validTo: iso };
  }
  return null;
}

/** Week-end ou jour férié — période d’affichage « garde ». */
export function isHealthOnCallPeriod(d = new Date()): boolean {
  const { dow } = tahitiParts(d);
  if (dow === 0 || dow === 6) return true;
  if (isTahitiPublicHoliday(d)) return true;
  // Vendredi à partir de 17h : préparation week-end
  if (dow === 5) {
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        hour: "2-digit",
        hour12: false,
      }).format(d),
    );
    return hour >= 17;
  }
  return false;
}

export function tahitiDateKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

export function formatTahitiDay(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
