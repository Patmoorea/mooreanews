/**
 * Horaires bus Moorea — Transport Public Moorea (J.RUTA / Commune).
 * Source : https://mooreatransportpublic.com/horaires
 */

import bundled from "../../data/buses-schedules.json";

const SOURCE_API =
  "https://mooreatransportpublic.com/.netlify/functions/content?type=schedules";

export type BusLineId = "L1" | "L2" | "L3" | "L4";
export type BusDirectionKey = "toVaiare" | "toTiahura";
export type BusDayKind = "week" | "sat";

export type BusFare = {
  label: string;
  price: number;
};

export type BusLineInfo = {
  id: BusLineId;
  label: string;
  direction: string;
  directionKey: BusDirectionKey;
  stops: string[];
};

export type BusDeparture = {
  time: string;
  rawTime: string;
  lines: BusLineId[];
  direction: BusDirectionKey;
  directionLabel: string;
  minutesUntil: number;
  schoolTermOnly?: boolean;
};

export type BusScheduleData = {
  meta: {
    operator: string;
    authority: string;
    sourceUrl: string;
    networkUrl: string;
    faresUrl: string;
    fares: BusFare[];
    notes: {
      schoolTerm: string;
      approximate: string;
      sunday: string;
    };
  };
  lines: Record<BusLineId, BusLineInfo>;
  schedules: Record<string, string[][]>;
};

export type NextBusDepartures = {
  toVaiare: BusDeparture[];
  toTiahura: BusDeparture[];
  fetchedAt: string;
  source: "mooreatransportpublic.com" | "mooreatransportpublic.com (cache)" | "unavailable";
  dayKind: BusDayKind | "sun" | null;
  serviceToday: boolean;
  operator: string;
  authority: string;
  fares: BusFare[];
  sourceUrl: string;
  networkUrl: string;
  faresUrl: string;
  notes: BusScheduleData["meta"]["notes"];
  lines: Record<BusLineId, BusLineInfo>;
};

const LINE_IDS: BusLineId[] = ["L1", "L2", "L3", "L4"];

function getTahitiClock(): {
  nowMin: number;
  weekday: string;
  dayKind: BusDayKind | "sun" | null;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const weekday = get("weekday");

  let dayKind: BusDayKind | "sun" | null;
  if (weekday === "Sun") dayKind = "sun";
  else if (weekday === "Sat") dayKind = "sat";
  else dayKind = "week";

  return { nowMin: hour * 60 + minute, weekday, dayKind };
}

function cleanTime(raw: string): string {
  return raw.replace("*", "").trim();
}

function timeToMinutes(t: string): number {
  const m = cleanTime(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return 9999;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatTimeFR(t: string): string {
  const m = cleanTime(t).match(/(\d{1,2}):(\d{2})/);
  if (!m) return t;
  return `${m[1]}h${m[2]}`;
}

function isSchoolTermOnly(raw: string): boolean {
  return raw.includes("*");
}

function loadBundled(): BusScheduleData {
  return bundled as BusScheduleData;
}

/** Horaires live depuis mooreatransportpublic.com (Netlify CMS). */
export async function fetchLiveBusSchedules(): Promise<
  Record<string, string[][]> | null
> {
  try {
    const res = await fetch(SOURCE_API, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent":
          "MooreaNews/1.0 (+https://www.mooreanews.com; bus schedule widget)",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { value?: Record<string, string[][]> };
    if (!data.value || typeof data.value !== "object") return null;
    return data.value;
  } catch {
    return null;
  }
}

export async function loadBusScheduleData(): Promise<{
  data: BusScheduleData;
  source: NextBusDepartures["source"];
}> {
  const bundledData = loadBundled();
  const live = await fetchLiveBusSchedules();
  if (live) {
    return {
      data: {
        ...bundledData,
        schedules: { ...bundledData.schedules, ...live },
      },
      source: "mooreatransportpublic.com",
    };
  }
  return {
    data: bundledData,
    source: "mooreatransportpublic.com (cache)",
  };
}

function directionKeyForLine(line: BusLineId): BusDirectionKey {
  return line === "L1" || line === "L2" ? "toVaiare" : "toTiahura";
}

function directionLabel(key: BusDirectionKey): string {
  return key === "toVaiare" ? "Tiahura → Vaiare" : "Vaiare → Tiahura";
}

type RawBusDep = {
  line: BusLineId;
  time: string;
  rawTime: string;
  direction: BusDirectionKey;
  directionLabel: string;
  minutesUntil: number;
  schoolTermOnly?: boolean;
};

export function computeNextBusDepartures(
  data: BusScheduleData,
  source: NextBusDepartures["source"],
): NextBusDepartures {
  const { nowMin, dayKind } = getTahitiClock();
  const meta = data.meta;

  if (dayKind === "sun") {
    return {
      toVaiare: [],
      toTiahura: [],
      fetchedAt: new Date().toISOString(),
      source,
      dayKind: "sun",
      serviceToday: false,
      operator: meta.operator,
      authority: meta.authority,
      fares: meta.fares,
      sourceUrl: meta.sourceUrl,
      networkUrl: meta.networkUrl,
      faresUrl: meta.faresUrl,
      notes: meta.notes,
      lines: data.lines,
    };
  }

  const kind = dayKind as BusDayKind;
  const rawDeps: RawBusDep[] = [];

  for (const line of LINE_IDS) {
    const rows = data.schedules[`${line}_${kind}`] ?? [];
    const dir = directionKeyForLine(line);
    for (const row of rows) {
      const rawTime = row[0] ?? "";
      const min = timeToMinutes(rawTime);
      if (min >= nowMin) {
        rawDeps.push({
          line,
          time: formatTimeFR(rawTime),
          rawTime,
          direction: dir,
          directionLabel: directionLabel(dir),
          minutesUntil: min - nowMin,
          schoolTermOnly: isSchoolTermOnly(rawTime),
        });
      }
    }
  }

  // Grouper les départs simultanés (ex. L1 + L2 à 07:45)
  const groups = new Map<string, BusDeparture>();
  for (const d of rawDeps) {
    const key = `${d.direction}|${cleanTime(d.rawTime)}`;
    const existing = groups.get(key);
    if (existing) {
      if (!existing.lines.includes(d.line)) {
        existing.lines.push(d.line);
        existing.lines.sort();
      }
      existing.schoolTermOnly =
        existing.schoolTermOnly || Boolean(d.schoolTermOnly);
    } else {
      groups.set(key, {
        time: d.time,
        rawTime: d.rawTime,
        lines: [d.line],
        direction: d.direction,
        directionLabel: d.directionLabel,
        minutesUntil: d.minutesUntil,
        schoolTermOnly: d.schoolTermOnly,
      });
    }
  }

  const all = [...groups.values()].sort((a, b) => a.minutesUntil - b.minutesUntil);
  const toVaiare = all.filter((d) => d.direction === "toVaiare").slice(0, 6);
  const toTiahura = all.filter((d) => d.direction === "toTiahura").slice(0, 6);

  const hasService = toVaiare.length > 0 || toTiahura.length > 0;

  return {
    toVaiare,
    toTiahura,
    fetchedAt: new Date().toISOString(),
    source: hasService ? source : "unavailable",
    dayKind: kind,
    serviceToday: hasService,
    operator: meta.operator,
    authority: meta.authority,
    fares: meta.fares,
    sourceUrl: meta.sourceUrl,
    networkUrl: meta.networkUrl,
    faresUrl: meta.faresUrl,
    notes: meta.notes,
    lines: data.lines,
  };
}

export function formatBusMinutesUntil(min: number): string {
  if (min <= 0) return "Maintenant";
  if (min < 60) return `dans ${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `dans ${h}h` : `dans ${h}h${String(m).padStart(2, "0")}`;
}

export function formatBusLines(lines: BusLineId[]): string {
  return lines.map((l) => `Ligne ${l.slice(1)}`).join(" · ");
}

/** Prochains bus du jour (live + cache local). */
export async function getNextBusDepartures(): Promise<NextBusDepartures> {
  const { data, source } = await loadBusScheduleData();
  return computeNextBusDepartures(data, source);
}

/** Horaires complets d'une ligne pour un type de jour. */
export function getLineSchedule(
  data: BusScheduleData,
  line: BusLineId,
  dayKind: BusDayKind,
): string[][] {
  return data.schedules[`${line}_${dayKind}`] ?? [];
}
