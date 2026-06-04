/**
 * Tahiti Cruise Club — escales publiques (7 prochains jours).
 * API utilisée par tahiticruiseclub.com : manager.tahiticruiseclub.com
 */

const TCC_STOPOVERS_URL =
  "https://manager.tahiticruiseclub.com/modules/stopovers/viewer.php";

export const TCC_SOURCE_URL = "https://www.tahiticruiseclub.com/";
export const TCC_SOURCE_LABEL = "Tahiti Cruise Club";

export type TccStopoverRow = {
  shipName: string;
  island: string;
  etaDateLabel: string;
  etaTime: string;
  etdDateLabel: string;
  etdTime: string;
};

/** Réponse JSON = chaîne HTML (table DataTables). */
function unwrapHtmlPayload(raw: string): string {
  const t = raw.trim();
  if (t.startsWith('"')) {
    try {
      return JSON.parse(t) as string;
    } catch {
      return t;
    }
  }
  return t;
}

export function parseTccStopoversHtml(html: string): TccStopoverRow[] {
  const rows: TccStopoverRow[] = [];
  const re =
    /<tr><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td><\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    rows.push({
      shipName: m[1].trim(),
      island: m[2].trim(),
      etaDateLabel: m[3].trim(),
      etaTime: m[4].trim(),
      etdDateLabel: m[5].trim(),
      etdTime: m[6].trim(),
    });
  }
  return rows;
}

/** DD/MM/YYYY dans les libellés TCC (« Friday 05/06/2026 »). */
export function parseTccDateLabel(label: string): string | null {
  const m = label.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

export async function fetchTccPublicStopovers(): Promise<TccStopoverRow[]> {
  const res = await fetch(TCC_STOPOVERS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "MooreaNews/1.0 (+https://www.mooreanews.com; Tahiti Cruise Club stopovers)",
      Referer: TCC_SOURCE_URL,
      Origin: "https://www.tahiticruiseclub.com",
    },
    body: "action=getPublicTable",
    next: { revalidate: 6 * 60 * 60 },
  });

  if (!res.ok) {
    throw new Error(`Tahiti Cruise Club HTTP ${res.status}`);
  }

  const raw = await res.text();
  return parseTccStopoversHtml(unwrapHtmlPayload(raw));
}
