/**
 * Extraits affichés sur les cartes (veille, actualités).
 * Le snapshot garde est du JSON technique : il ne doit jamais apparaître tel quel.
 */

export const GARDE_VEILLE_SOURCE_ID = "moorea-garde-weekend";
export const GARDE_CACHE_PAYLOAD_SOURCE_ID = "moorea-garde-weekend-payload";

const MONTHS_FR = [
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

export type GardeExcerptSource = {
  validFrom?: string | null;
  validTo?: string | null;
  doctor?: { name?: string | null } | null;
  pharmacy?: { name?: string | null } | null;
};

export type GardeSnapshotJson = GardeExcerptSource & {
  validFrom: string;
  validTo: string;
  label?: string;
  articleSlug?: string;
  syncedAt?: string;
  sourceUrl?: string;
  posterImageUrl?: string | null;
};

export function isGardeCacheSource(sourceId: string | null | undefined): boolean {
  return (
    sourceId === GARDE_VEILLE_SOURCE_ID ||
    sourceId === GARDE_CACHE_PAYLOAD_SOURCE_ID
  );
}

/** Sources retirées du bloc « Moorea sur le web ». Le payload garde reste lisible en base. */
export function externalArticleSourcesHiddenFromVeille(
  employmentSourceIds: readonly string[],
): string[] {
  return [...employmentSourceIds, GARDE_CACHE_PAYLOAD_SOURCE_ID];
}

function parseIsoDate(
  iso: string,
): { day: number; month: number; year: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

function formatDoctorLabel(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  if (/^(dr\.?|docteur)\b/i.test(trimmed)) return trimmed;
  return `Dr ${trimmed}`;
}

function personName(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const name = (value as { name?: unknown }).name;
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed ? trimmed : null;
}

/** « 17 au 18 octobre », « 17 octobre », ou « 31 octobre au 1 novembre ». */
export function formatGardeDayRange(validFrom: string, validTo: string): string | null {
  const from = parseIsoDate(validFrom);
  if (!from) return null;
  const to = parseIsoDate(validTo) ?? from;
  const monthFrom = MONTHS_FR[from.month - 1]!;
  const monthTo = MONTHS_FR[to.month - 1]!;

  if (from.year === to.year && from.month === to.month && from.day === to.day) {
    return `${from.day} ${monthFrom}`;
  }
  if (from.year === to.year && from.month === to.month) {
    return `${from.day} au ${to.day} ${monthFrom}`;
  }
  if (from.year === to.year) {
    return `${from.day} ${monthFrom} au ${to.day} ${monthTo}`;
  }
  return `${from.day} ${monthFrom} ${from.year} au ${to.day} ${monthTo} ${to.year}`;
}

/** Phrase affichée sur la carte veille, ex. « Garde du 17 au 18 octobre : Dr … ». */
export function buildGardeVeilleExcerpt(snap: GardeExcerptSource): string {
  const from = snap.validFrom?.trim() ?? "";
  const to = snap.validTo?.trim() || from;
  const range = from ? formatGardeDayRange(from, to) : null;
  const doctor = snap.doctor?.name ? formatDoctorLabel(snap.doctor.name) : "";
  const pharmacy = snap.pharmacy?.name?.trim() ?? "";
  const who = [doctor, pharmacy].filter(Boolean).join(" · ");

  if (range && who) return `Garde du ${range} : ${who}`;
  if (range) return `Garde du ${range}`;
  if (who) return `Garde Moorea : ${who}`;
  return "Garde Moorea";
}

/** Extrait public enregistré sur la ligne de veille (jamais le JSON du snapshot). */
export function gardeCachePublicExcerpt(snap: GardeExcerptSource): string {
  return buildGardeVeilleExcerpt(snap).slice(0, 500);
}

export function looksLikeRawJson(value: string): boolean {
  const trimmed = value.trim().replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  return /"(?:\\.|[^"\\])*"\s*:/.test(trimmed);
}

function gardeSourceFromJson(value: unknown): GardeExcerptSource | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.validFrom !== "string" || !record.validFrom.trim()) return null;
  const validTo =
    typeof record.validTo === "string" && record.validTo.trim()
      ? record.validTo
      : record.validFrom;
  return {
    validFrom: record.validFrom,
    validTo,
    doctor: { name: personName(record.doctor) },
    pharmacy: { name: personName(record.pharmacy) },
  };
}

function gardeSourceFromTruncatedJson(raw: string): GardeExcerptSource | null {
  const from = raw.match(/"validFrom"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  if (!from?.[1]) return null;
  const to = raw.match(/"validTo"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  const doctor = raw.match(
    /"doctor"\s*:\s*\{[\s\S]{0,500}?"name"\s*:\s*"((?:\\.|[^"\\])*)"/,
  );
  const pharmacy = raw.match(
    /"pharmacy"\s*:\s*\{[\s\S]{0,500}?"name"\s*:\s*"((?:\\.|[^"\\])*)"/,
  );
  return {
    validFrom: from[1],
    validTo: to?.[1] ?? from[1],
    doctor: doctor?.[1] ? { name: decodeJsonString(doctor[1]) } : null,
    pharmacy: pharmacy?.[1] ? { name: decodeJsonString(pharmacy[1]) } : null,
  };
}

function decodeJsonString(raw: string): string {
  try {
    const parsed = JSON.parse(`"${raw}"`) as unknown;
    return typeof parsed === "string" ? parsed : raw;
  } catch {
    return raw;
  }
}

/** Snapshot complet si l'extrait est le JSON de garde (ligne historique ou payload). */
export function parseGardeSnapshotJson(raw: string): GardeSnapshotJson | null {
  const trimmed = raw.trim().replace(/^\uFEFF/, "");
  if (!looksLikeRawJson(trimmed)) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    const source = gardeSourceFromJson(parsed);
    if (!source?.validFrom || !source.validTo) return null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as GardeSnapshotJson;
  } catch {
    return null;
  }
}

/**
 * Texte sûr pour une carte.
 * Un extrait JSON de garde redevient une phrase. Tout autre JSON est masqué.
 */
export function excerptForCard(excerpt: string | null | undefined): string | null {
  if (excerpt == null) return null;
  const trimmed = excerpt.trim().replace(/^\uFEFF/, "");
  if (!trimmed) return null;
  if (!looksLikeRawJson(trimmed)) return trimmed;

  let source: GardeExcerptSource | null = null;
  try {
    source = gardeSourceFromJson(JSON.parse(trimmed) as unknown);
  } catch {
    source = gardeSourceFromTruncatedJson(trimmed);
  }
  if (!source) return null;
  return buildGardeVeilleExcerpt(source);
}
