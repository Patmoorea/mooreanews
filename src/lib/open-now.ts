/**
 * Détection simplifiée « ouvert maintenant » à partir du texte horaires.
 */

const DAY_ALIASES: Record<number, string[]> = {
  0: ["dim", "dimanche", "sun"],
  1: ["lun", "lundi", "mon"],
  2: ["mar", "mardi", "tue"],
  3: ["mer", "mercredi", "wed"],
  4: ["jeu", "jeudi", "thu"],
  5: ["ven", "vendredi", "fri"],
  6: ["sam", "samedi", "sat"],
};

function tahitiNow(): { day: number; minutes: number } {
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

function dayMatches(segment: string, day: number): boolean {
  const s = segment.toLowerCase();
  if (/tous les jours|7j|7\s*\/\s*7|every day|daily/.test(s)) return true;
  if (/lun.*dim|lundi.*dimanche|mon.*sun/.test(s)) return true;
  const aliases = DAY_ALIASES[day] ?? [];
  return aliases.some((a) => s.includes(a));
}

/** Retourne true/false si détectable, null si horaires non parsables. */
export function isOpenNow(hoursText: string | undefined | null): boolean | null {
  const raw = (hoursText ?? "").trim();
  if (!raw) return null;
  if (/fermé|closed|sur rendez-vous|appointment only/i.test(raw)) return false;

  const { day, minutes } = tahitiNow();
  const segments = raw.split(/[;|/•]/).map((s) => s.trim()).filter(Boolean);

  for (const segment of segments) {
    if (!dayMatches(segment, day)) continue;
    const range = segment.match(
      /(\d{1,2}\s*[h:]\s*\d{0,2})\s*[-–àa]\s*(\d{1,2}\s*[h:]\s*\d{0,2})/i,
    );
    if (!range) continue;
    const start = parseTimeToMinutes(range[1]);
    const end = parseTimeToMinutes(range[2]);
    if (start == null || end == null) continue;
    if (end < start) {
      if (minutes >= start || minutes <= end) return true;
    } else if (minutes >= start && minutes <= end) {
      return true;
    }
  }

  return false;
}
