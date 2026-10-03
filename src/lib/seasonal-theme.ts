/**
 * Habillage saisonnier, heure de Tahiti (Pacific/Tahiti, UTC−10, sans heure d'été).
 * Hors fenêtre : thème lagon d'origine.
 *
 * L'ordre du tableau est la priorité. Un créneau court gagne sur une saison longue.
 * La Coupe du monde 2026 cède juillet au Heiva. Les baleines cèdent juillet, octobre
 * et Hawaiki Nui. La vigilance météo n'est pas un thème.
 * L'anniversaire MooreaNews n'est pas branché : aucune date de fondation dans le dépôt.
 */

const TIME_ZONE = "Pacific/Tahiti";

export type SeasonId =
  | "nouvel-an"
  | "saint-valentin"
  | "paques"
  | "rentree"
  | "hawaiki-nui"
  | "heiva"
  | "octobre-rose"
  | "coupe-du-monde"
  | "noel"
  | "baleines";

export type Season = {
  id: SeasonId;
  /** Une ligne, sans don, sans promesse médicale, sans partenaire inventé. */
  banner: string;
  themeColor: string;
  themeColorDark: string;
  pageColor: string;
};

export type TahitiStamp = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

type CalendarDay = {
  year: number;
  month: number;
  day: number;
};

export function tahitiStamp(now: Date): TahitiStamp {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  let hour = Number(read("hour"));
  if (hour === 24) hour = 0;
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour,
  };
}

/** Dimanche de Pâques grégorien (algorithme de Meeus). */
export function easterSunday(year: number): CalendarDay {
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
  return { year, month, day };
}

function shiftDays(date: CalendarDay, days: number): CalendarDay {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function ymd(date: CalendarDay): number {
  return date.year * 10000 + date.month * 100 + date.day;
}

function inRange(
  stamp: TahitiStamp,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): boolean {
  const current = stamp.month * 100 + stamp.day;
  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;
  return current >= start && current <= end;
}

function isNouvelAn(stamp: TahitiStamp): boolean {
  if (stamp.month === 1 && stamp.day <= 2) return true;
  return stamp.month === 12 && stamp.day === 31 && stamp.hour >= 12;
}

function isEasterWeekend(stamp: TahitiStamp): boolean {
  const sunday = easterSunday(stamp.year);
  const friday = shiftDays(sunday, -2);
  const monday = shiftDays(sunday, 1);
  const current = ymd(stamp);
  return current >= ymd(friday) && current <= ymd(monday);
}

const SEASONS: Array<Season & { match: (stamp: TahitiStamp) => boolean }> = [
  {
    id: "nouvel-an",
    banner: "Bonne année — meilleurs vœux à tous.",
    themeColor: "#1e3a5f",
    themeColorDark: "#0c1730",
    pageColor: "#fbf7ee",
    match: isNouvelAn,
  },
  {
    id: "saint-valentin",
    banner: "Joyeuse Saint-Valentin.",
    themeColor: "#9f1239",
    themeColorDark: "#6b1028",
    pageColor: "#fff7f7",
    match: (stamp) => inRange(stamp, 2, 13, 2, 15),
  },
  {
    id: "paques",
    banner: "Joyeuses Pâques.",
    themeColor: "#166534",
    themeColorDark: "#052e16",
    pageColor: "#f4fbf6",
    match: isEasterWeekend,
  },
  {
    id: "rentree",
    banner: "Bonne rentrée.",
    themeColor: "#3f6212",
    themeColorDark: "#1a2e05",
    pageColor: "#f8faf3",
    match: (stamp) => inRange(stamp, 8, 10, 8, 25),
  },
  {
    id: "hawaiki-nui",
    banner: "Hawaiki Nui — la course, notre héritage.",
    themeColor: "#0e7490",
    themeColorDark: "#0c4a6e",
    pageColor: "#f3fbff",
    match: (stamp) =>
      inRange(stamp, 10, 25, 10, 31) || inRange(stamp, 11, 1, 11, 5),
  },
  {
    id: "heiva",
    banner: "Heiva i Tahiti — notre culture, notre fierté.",
    themeColor: "#9a3412",
    themeColorDark: "#6b240f",
    pageColor: "#fff8f3",
    match: (stamp) => inRange(stamp, 7, 1, 7, 31),
  },
  {
    id: "octobre-rose",
    banner: "Octobre rose — MooreaNews porte le ruban rose.",
    themeColor: "#c2185b",
    themeColorDark: "#6b1238",
    pageColor: "#fff7f9",
    match: (stamp) => stamp.month === 10,
  },
  {
    id: "coupe-du-monde",
    banner: "Coupe du monde — vivre ensemble la passion.",
    themeColor: "#1d4ed8",
    themeColorDark: "#172554",
    pageColor: "#f5f7fb",
    /* 11 juin – 19 juillet 2026. Juillet est déjà pris par le Heiva. */
    match: (stamp) =>
      stamp.year === 2026 &&
      (inRange(stamp, 6, 11, 6, 30) || inRange(stamp, 7, 1, 7, 19)),
  },
  {
    id: "noel",
    banner: "Joyeux Noël.",
    themeColor: "#b91c1c",
    themeColorDark: "#6b1212",
    pageColor: "#fff8f6",
    match: (stamp) => inRange(stamp, 12, 15, 12, 26),
  },
  {
    id: "baleines",
    banner: "Saison des baleines.",
    themeColor: "#0f766e",
    themeColorDark: "#0f3d3a",
    pageColor: "#f3fbfb",
    match: (stamp) => inRange(stamp, 7, 1, 10, 31),
  },
];

export function activeSeason(now: Date = new Date()): Season | null {
  const stamp = tahitiStamp(now);
  const season = SEASONS.find((item) => item.match(stamp));
  if (!season) return null;
  return {
    id: season.id,
    banner: season.banner,
    themeColor: season.themeColor,
    themeColorDark: season.themeColorDark,
    pageColor: season.pageColor,
  };
}
