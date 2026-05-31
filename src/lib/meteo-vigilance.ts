/**
 * Vigilance météo officielle Météo-France Polynésie (meteo.pf).
 * API publique via rpcache.meteo.pf (token session cookie mfsession, ROT13).
 */

const METEO_API_BASE =
  "https://rpcache.meteo.pf/internet2018client/2.0";
const METEO_SESSION_URL = "https://meteo.pf/fr/vigilance";
export const METEO_VIGILANCE_PAGE = "https://meteo.pf/fr/vigilance";
export const METEO_VIGILANCE_MOOREA_PAGE =
  "https://meteo.pf/fr/vigilance/tahiti-moorea";
export const METEO_VIGILANCE_SOURCE_ID = "meteo-vigilance-vigi987";
export const INFOSCYCLONES_URL = "https://www.facebook.com/infoscyclones";
/** Carte sur la page Tahiti–Moorea (/carte renvoie 404 côté Météo-France). */
export const METEO_VIGILANCE_MAP_URL = METEO_VIGILANCE_MOOREA_PAGE;
export const METEO_CYCLONE_PAGE = "https://meteo.pf/fr/cyclone";

/** Zones Îles du Vent / Tahiti-Moorea (meteo.pf). */
export const MOOREA_VIGILANCE_ZONE_IDS = [
  "VIGI987-14",
  "VIGI987-14-01",
  "VIGI987-14-50",
  "VIGI987-14-51",
  "VIGI987-14-52",
  "VIGI987-14-53",
  "VIGI987-14-55",
  "VIGI987-14-56",
  "VIGI987-14-57",
  "VIGI987-14-58",
  "VIGI987-14-59",
  "VIGI987-14-60",
  "VIGI987-14-61",
  "VIGI987-14-62",
  "VIGI987-14-63",
] as const;

export const VIGILANCE_ZONE_LABELS: Record<string, string> = {
  "VIGI987-14": "Îles du Vent",
  "VIGI987-14-01": "Tahiti et Moorea (zone terre)",
  "VIGI987-14-50": "Moorea Est",
  "VIGI987-14-51": "Moorea Nord",
  "VIGI987-14-52": "Moorea Ouest",
  "VIGI987-14-53": "Tahiti Iti Sud",
  "VIGI987-14-55": "Tahiti Nui Est",
  "VIGI987-14-56": "Tahiti Nui Nord",
  "VIGI987-14-57": "Tahiti Nui Nord-Ouest",
  "VIGI987-14-58": "Tahiti Nui Faa'a",
  "VIGI987-14-59": "Tahiti Nui Ouest",
  "VIGI987-14-60": "Tahiti Nui Sud",
  "VIGI987-14-61": "Tahiti-Iti Nord",
  "VIGI987-14-62": "Tahiti-Iti Tautira Bourg",
  "VIGI987-14-63": "Tahiti-Iti Te-Pari",
};

/** Phénomènes vigilance meteo.pf — Polynésie (≠ numérotation métropole). */
export const PHENOMENON_LABELS: Record<number, string> = {
  1: "Vents violents",
  2: "Fortes pluies / inondations",
  3: "Orages",
  9: "Vagues-submersion",
};

/** Alerte cyclone = filière séparée `alerte_cyclone` sur meteo.pf (pas le phénomène 9). */
export const CYCLONE_ALERT_LABEL = "Cyclone tropical";

type VigilanceColor = {
  id: number;
  level: number;
  name: string;
  hexaCode: string;
};

type SubdomainMaxColor = {
  domain_id: string;
  max_color_id: number;
};

export type VigilanceMaxColorResponse = {
  update_time: number;
  end_validity_time: number;
  domain_id: string;
  max_color_id: number;
  subdomains_max_color: SubdomainMaxColor[];
};

export type VigilanceTimelapsItem = {
  begin_time: number;
  end_time: number;
  color_id: number;
};

export type VigilanceTimelapsResponse = {
  update_time: number;
  end_validity_time: number;
  domain_id: string;
  timelaps: {
    phenomenon_id: number;
    timelaps_items: VigilanceTimelapsItem[];
  }[];
};

export type ActivePhenomenon = {
  id: number;
  label: string;
  colorId: number;
  colorName: string;
};

export type MeteoVigilanceSnapshot = {
  updateTime: number;
  endValidityTime: number;
  nationalMaxColorId: number;
  mooreaMaxColorId: number;
  mooreaZones: { id: string; label: string; maxColorId: number }[];
  cycloneMaxColorId: number | null;
  activePhenomena: ActivePhenomenon[];
  levelLabel: string;
  levelName: string;
  severity: "info" | "warning" | "alert";
  urgent: boolean;
  details: string;
  sourceUrl: string;
  syncFingerprint: string;
};

const LEVEL_META: Record<
  number,
  { label: string; severity: "info" | "warning" | "alert"; urgent: boolean }
> = {
  1: { label: "Pas de vigilance particulière", severity: "info", urgent: false },
  2: { label: "Soyez attentif", severity: "info", urgent: false },
  3: { label: "Soyez très vigilant", severity: "warning", urgent: true },
  4: { label: "Une vigilance absolue s'impose", severity: "alert", urgent: true },
  5: { label: "Confinez-vous", severity: "alert", urgent: true },
};

const COLOR_NAMES: Record<number, string> = {
  1: "verte",
  2: "jaune",
  3: "orange",
  4: "rouge",
  5: "rouge",
};

function rot13(value: string): string {
  return value.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    return String.fromCharCode(
      base + ((char.charCodeAt(0) - base + 13) % 26),
    );
  });
}

function parseMfSessionCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  const match = setCookie.match(/mfsession=([^;]+)/i);
  if (!match?.[1]) return null;
  return rot13(decodeURIComponent(match[1]));
}

async function fetchMeteoToken(): Promise<string> {
  const res = await fetch(METEO_SESSION_URL, {
    headers: { "User-Agent": "MooreaNews/1.0 (+https://mooreanews.com)" },
    cache: "no-store",
  });
  const token = parseMfSessionCookie(res.headers.get("set-cookie"));
  if (!token) {
    throw new Error("Token météo.pf indisponible (cookie mfsession)");
  }
  return token;
}

async function meteoApiGet<T>(
  token: string,
  path: string,
  params: Record<string, string | number | null | undefined>,
): Promise<T> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const url = `${METEO_API_BASE}/${path}?${qs.toString()}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "MooreaNews/1.0 (+https://mooreanews.com)",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API meteo.pf ${path}: HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function maxForZones(
  subdomains: SubdomainMaxColor[],
  zoneIds: readonly string[],
): { max: number; zones: { id: string; label: string; maxColorId: number }[] } {
  const set = new Set(zoneIds);
  const zones = subdomains
    .filter((z) => set.has(z.domain_id))
    .map((z) => ({
      id: z.domain_id,
      label: VIGILANCE_ZONE_LABELS[z.domain_id] ?? z.domain_id,
      maxColorId: z.max_color_id,
    }))
    .filter((z) => z.maxColorId > 1)
    .sort((a, b) => b.maxColorId - a.maxColorId);

  const max = zones.reduce((m, z) => Math.max(m, z.maxColorId), 1);
  return { max, zones };
}

function buildDetails(
  snapshot: {
    mooreaZones: { id: string; label: string; maxColorId: number }[];
    nationalMax: number;
    endValidityTime: number;
    activePhenomena: ActivePhenomenon[];
    levelLabel: string;
    cycloneMaxColorId: number | null;
  },
): string {
  const lines: string[] = [];

  lines.push(
    `Bulletin Météo-France Polynésie · ${snapshot.levelLabel}.`,
  );
  lines.push(
    `Validité jusqu'au ${new Date(snapshot.endValidityTime * 1000).toLocaleString("fr-FR", { timeZone: "Pacific/Tahiti", dateStyle: "full", timeStyle: "short" })} (heure de Tahiti).`,
  );

  if (snapshot.activePhenomena.length > 0) {
    lines.push("");
    lines.push("Phénomènes en vigilance (Tahiti–Moorea) :");
    for (const p of snapshot.activePhenomena) {
      lines.push(
        `• ${p.label} — niveau ${COLOR_NAMES[p.colorId] ?? p.colorId} (${LEVEL_META[p.colorId]?.label ?? "vigilance"})`,
      );
    }
  } else if (snapshot.mooreaZones.length > 0) {
    lines.push("");
    lines.push(
      "Zones sous vigilance : " +
        snapshot.mooreaZones
          .slice(0, 8)
          .map((z) => `${z.label} (${COLOR_NAMES[z.maxColorId] ?? "niveau " + z.maxColorId})`)
          .join(", ") +
        (snapshot.mooreaZones.length > 8 ? "…" : ""),
    );
    lines.push(
      "Consultez la carte officielle pour le détail vent / pluie / houle / cyclone.",
    );
  } else if (snapshot.nationalMax > 1) {
    lines.push("");
    lines.push(
      "Vigilance en cours en Polynésie — consultez meteo.pf pour le détail par phénomène.",
    );
  }

  if (snapshot.cycloneMaxColorId !== null && snapshot.cycloneMaxColorId >= 2) {
    lines.push("");
    lines.push(
      `${CYCLONE_ALERT_LABEL} (alerte dédiée) : niveau ${COLOR_NAMES[snapshot.cycloneMaxColorId] ?? snapshot.cycloneMaxColorId} — Infos Cyclones (Facebook officiel).`,
    );
  }

  lines.push("");
  lines.push("Liens officiels :");
  lines.push(`→ Carte vigilance Tahiti–Moorea : ${METEO_VIGILANCE_MAP_URL}`);
  lines.push(`→ Bulletin complet : ${METEO_VIGILANCE_MOOREA_PAGE}`);
  lines.push(`→ Infos cyclones : ${INFOSCYCLONES_URL}`);

  return lines.join("\n");
}

async function fetchActivePhenomena(
  token: string,
  domain: string,
  nowSec: number,
): Promise<ActivePhenomenon[]> {
  try {
    const data = await meteoApiGet<VigilanceTimelapsResponse>(
      token,
      "warning/timelaps",
      {
        warning_type: "vigilance",
        domain,
      },
    );

    const active: ActivePhenomenon[] = [];
    for (const block of data.timelaps ?? []) {
      const label =
        PHENOMENON_LABELS[block.phenomenon_id] ??
        `Phénomène ${block.phenomenon_id}`;
      let maxColor = 0;
      for (const item of block.timelaps_items ?? []) {
        if (nowSec >= item.begin_time && nowSec < item.end_time) {
          maxColor = Math.max(maxColor, item.color_id);
        }
      }
      if (maxColor >= 2) {
        active.push({
          id: block.phenomenon_id,
          label,
          colorId: maxColor,
          colorName: COLOR_NAMES[maxColor] ?? String(maxColor),
        });
      }
    }
    return active.sort((a, b) => b.colorId - a.colorId);
  } catch {
    return [];
  }
}

/** Récupère l'état actuel de la vigilance pour Moorea / Tahiti. */
export async function fetchMeteoVigilance(): Promise<MeteoVigilanceSnapshot> {
  const token = await fetchMeteoToken();
  const nowSec = Math.floor(Date.now() / 1000);

  const [vigi, cyclone, phenomena] = await Promise.all([
    meteoApiGet<VigilanceMaxColorResponse>(token, "warning/maxcolor", {
      warning_type: "vigilance",
      domain: "VIGI987",
      depth: 1,
    }),
    meteoApiGet<VigilanceMaxColorResponse>(token, "warning/maxcolor", {
      warning_type: "alerte_cyclone",
      domain: "CYCL987",
      depth: 1,
    }).catch(() => null),
    fetchActivePhenomena(token, "VIGI987-14", nowSec),
  ]);

  const { max: mooreaMax, zones: mooreaZones } = maxForZones(
    vigi.subdomains_max_color ?? [],
    MOOREA_VIGILANCE_ZONE_IDS,
  );

  const cycloneLevel = cyclone?.max_color_id ?? null;

  const levelId =
    cycloneLevel !== null && cycloneLevel >= 4
      ? Math.max(mooreaMax, cycloneLevel)
      : mooreaMax;
  const meta = LEVEL_META[levelId] ?? LEVEL_META[4];
  const colorName = COLOR_NAMES[levelId] ?? "inconnue";

  const activePhenomena = phenomena;
  const syncFingerprint = `${vigi.update_time}|${levelId}|${cycloneLevel}|${activePhenomena.map((p) => `${p.id}:${p.colorId}`).join(",")}`;

  return {
    updateTime: vigi.update_time,
    endValidityTime: vigi.end_validity_time,
    nationalMaxColorId: vigi.max_color_id,
    mooreaMaxColorId: mooreaMax,
    mooreaZones,
    cycloneMaxColorId: cycloneLevel,
    activePhenomena,
    levelLabel: meta.label,
    levelName: colorName,
    severity: meta.severity,
    urgent: meta.urgent || (cycloneLevel !== null && cycloneLevel >= 4),
    details: buildDetails({
      mooreaZones,
      nationalMax: vigi.max_color_id,
      endValidityTime: vigi.end_validity_time,
      activePhenomena,
      levelLabel: meta.label,
      cycloneMaxColorId: cycloneLevel,
    }),
    sourceUrl: METEO_VIGILANCE_MOOREA_PAGE,
    syncFingerprint,
  };
}

export function vigilanceAlertTitle(snapshot: MeteoVigilanceSnapshot): string {
  const color =
    snapshot.levelName.charAt(0).toUpperCase() + snapshot.levelName.slice(1);

  const vigilancePhen =
    snapshot.activePhenomena.length > 0
      ? snapshot.activePhenomena.map((p) => p.label).join(", ")
      : null;

  if (vigilancePhen) {
    return `Vigilance ${color} — ${vigilancePhen}`;
  }

  if (snapshot.cycloneMaxColorId !== null && snapshot.cycloneMaxColorId >= 2) {
    return `Alerte ${CYCLONE_ALERT_LABEL.toLowerCase()} — ${snapshot.levelLabel}`;
  }

  return `Vigilance météo ${color} — Tahiti & Moorea`;
}

export function vigilanceNeedsAlert(snapshot: MeteoVigilanceSnapshot): boolean {
  if (snapshot.mooreaMaxColorId >= 2) return true;
  if (snapshot.cycloneMaxColorId !== null && snapshot.cycloneMaxColorId >= 4) {
    return true;
  }
  return false;
}

/** Retire la balise technique de synchro avant affichage public. */
export function meteoAlertPublicDetails(details: string | null): string {
  if (!details) return "";
  return details.replace(/\n<!--vigilance-sync:[^>]+-->/g, "").trim();
}
