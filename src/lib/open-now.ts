/**
 * Estimation « ouvert » à partir du texte horaires saisi dans l’annuaire.
 * Ce n’est PAS une info temps réel — horaires indicatifs, sans appel ni API Google.
 */

export const OPEN_HOURS_DISCLAIMER =
  "Horaires saisis manuellement dans l’annuaire MooreaNews — appelez l’établissement avant de vous déplacer.";

const DAY_INDEX: Record<string, number> = {
  dim: 0,
  dimanche: 0,
  sun: 0,
  sunday: 0,
  lun: 1,
  lundi: 1,
  mon: 1,
  monday: 1,
  mar: 2,
  mardi: 2,
  tue: 2,
  tuesday: 2,
  mer: 3,
  mercredi: 3,
  wed: 3,
  wednesday: 3,
  jeu: 4,
  jeudi: 4,
  thu: 4,
  thursday: 4,
  ven: 5,
  vendredi: 5,
  fri: 5,
  friday: 5,
  sam: 6,
  samedi: 6,
  sat: 6,
  saturday: 6,
};

const DAY_ALIASES: Record<number, string[]> = {
  0: ["dim", "dimanche", "sun"],
  1: ["lun", "lundi", "mon"],
  2: ["mar", "mardi", "tue"],
  3: ["mer", "mercredi", "wed"],
  4: ["jeu", "jeudi", "thu"],
  5: ["ven", "vendredi", "fri"],
  6: ["sam", "samedi", "sat"],
};

export type TahitiClock = { day: number; minutes: number };

export function tahitiNow(): TahitiClock {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const weekday = get("weekday").toLowerCase();
  const dayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  const day = dayMap[weekday.slice(0, 3)] ?? new Date().getDay();
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return { day, minutes: hour * 60 + minute };
}

function parseTimeToMinutes(token: string): number | null {
  const m = token.match(/(\d{1,2})\s*[h:]\s*(\d{0,2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function dayInSpan(start: number, end: number, day: number): boolean {
  if (start === end) return day === start;
  if (start < end) return day >= start && day <= end;
  return day >= start || day <= end;
}

function isBareTimeSegment(segment: string): boolean {
  const s = segment.trim();
  if (!/(\d{1,2}\s*[h:]\s*\d{0,2})\s*[-–àa]\s*(\d{1,2}\s*[h:]\s*\d{0,2})/i.test(s)) {
    return false;
  }
  return !Object.keys(DAY_INDEX).some((d) => new RegExp(`\\b${d}\\b`, "i").test(s));
}

function dayMatches(segment: string, day: number, wholeText: string): boolean {
  const s = segment.toLowerCase();
  const allDays = /tous les jours|every day|daily|7\s*\/\s*7|7j\/7/.test(
    wholeText.toLowerCase(),
  );

  if (isBareTimeSegment(segment) && allDays) return true;

  if (/^fermé|^closed|sur rendez-vous|appointment only/i.test(s)) return false;
  if (/tous les jours|every day|daily/.test(s)) return true;
  if (/7\s*\/\s*7|7j\/7/.test(s)) return true;
  if (/lun.*dim|lundi.*dimanche|mon.*sun/.test(s)) return true;

  const range = s.match(
    /(lun|lundi|mon|mar|mardi|tue|mer|mercredi|wed|jeu|jeudi|thu|ven|vendredi|fri|sam|samedi|sat|dim|dimanche|sun)\s*[-–]\s*(lun|lundi|mon|mar|mardi|tue|mer|mercredi|wed|jeu|jeudi|thu|ven|vendredi|fri|sam|samedi|sat|dim|dimanche|sun)/,
  );
  if (range) {
    const start = DAY_INDEX[range[1]] ?? -1;
    const end = DAY_INDEX[range[2]] ?? -1;
    if (start >= 0 && end >= 0) return dayInSpan(start, end, day);
  }

  return (DAY_ALIASES[day] ?? []).some((a) => {
    const re = new RegExp(`\\b${a}\\b`, "i");
    return re.test(s);
  });
}

function minutesInRange(minutes: number, start: number, end: number): boolean {
  if (end < start) return minutes >= start || minutes <= end;
  return minutes >= start && minutes <= end;
}

/** true/false si détectable, null si horaires absents ou non parsables. */
export function isOpenAt(
  hoursText: string | undefined | null,
  clock: TahitiClock,
): boolean | null {
  const raw = (hoursText ?? "").trim();
  if (!raw) return null;
  if (/^fermé|^closed|sur rendez-vous|appointment only/i.test(raw)) return false;

  const { day, minutes } = clock;
  const segments = raw
    .split(/[;|•]/)
    .flatMap((part) => part.split(/\s+\/\s+/))
    .map((s) => s.trim())
    .filter(Boolean);

  let parsed = false;

  for (const segment of segments) {
    if (!dayMatches(segment, day, raw)) continue;

    const ranges = [
      ...segment.matchAll(
        /(\d{1,2}\s*[h:]\s*\d{0,2})\s*[-–àa]\s*(\d{1,2}\s*[h:]\s*\d{0,2})/gi,
      ),
    ];

    for (const range of ranges) {
      const start = parseTimeToMinutes(range[1]!);
      const end = parseTimeToMinutes(range[2]!);
      if (start == null || end == null) continue;
      parsed = true;
      if (minutesInRange(minutes, start, end)) return true;
    }
  }

  return parsed ? false : null;
}

export function isOpenNow(hoursText: string | undefined | null): boolean | null {
  return isOpenAt(hoursText, tahitiNow());
}

/** Estimation pour « ce soir » — créneau 18h30 à Tahiti. */
export function isOpenThisEvening(hoursText: string | undefined | null): boolean | null {
  const now = tahitiNow();
  return isOpenAt(hoursText, { day: now.day, minutes: 18 * 60 + 30 });
}
