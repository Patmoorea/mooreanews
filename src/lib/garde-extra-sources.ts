/**
 * Sources secondaires du tour de garde (secours si le tableau COPPF du week-end
 * n'est pas publié) : articles TNTV « pharmacies et médecins de garde » et
 * page Gardes du Conseil de l'Ordre des médecins (987).
 * Ne renvoie que des images liées au week-end attendu (dates contrôlées).
 */
const MONTHS = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];
const UA = { "User-Agent": "Mozilla/5.0 (MooreaNews garde bot)" };

export type GardeExtraImage = { url: string; source: string; pageUrl: string };

function weekendSlugPart(validFrom: string, validTo: string): string {
  const [, m1, d1] = validFrom.split("-").map(Number);
  const [, m2, d2] = validTo.split("-").map(Number);
  if (m1 === m2) return `les-${d1}-et-${d2}-${MONTHS[m1 - 1]}`;
  return `les-${d1}-${MONTHS[m1 - 1]}-et-${d2}-${MONTHS[m2 - 1]}`;
}

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: UA, cache: "no-store", signal: AbortSignal.timeout(15000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export async function fetchTntvGardeImages(validFrom: string, validTo: string): Promise<GardeExtraImage[]> {
  const part = weekendSlugPart(validFrom, validTo);
  const listing = await getText("https://www.tntvnews.pf/infospratiques/");
  const year = validFrom.slice(0, 4);
  const links = new Set<string>();
  for (const m of (listing ?? "").matchAll(/https:\/\/www\.tntvnews\.pf\/infospratiques\/([a-z0-9-]+)\//g)) {
    if (m[1].includes("garde") && m[1].includes(part)) links.add(m[0]);
  }
  links.add(`https://www.tntvnews.pf/infospratiques/les-pharmacies-et-medecins-de-garde-en-polynesie-${part}/`);
  const out: GardeExtraImage[] = [];
  for (const pageUrl of links) {
    const html = await getText(pageUrl);
    if (!html) continue;
    const re = new RegExp(`https://www\\.tntvnews\\.pf/tntv/wp-content/uploads/${year}/\\d{2}/[^"'\\s?]+\\.(?:png|jpe?g)`, "gi");
    for (const m of html.matchAll(re)) {
      if (/logo|appstore|googleplay|-\d+x\d+\./i.test(m[0])) continue;
      if (!out.some((o) => o.url === m[0])) out.push({ url: m[0], source: "tntv", pageUrl });
    }
  }
  return out;
}

const ORDRE_GARDES_URL = "https://conseil987.ordre.medecin.fr/gardes";

export async function fetchOrdreMedecinsGardeImages(validFrom: string, validTo: string): Promise<GardeExtraImage[]> {
  const html = await getText(ORDRE_GARDES_URL);
  if (!html) return [];
  const [y, m1, d1] = validFrom.split("-").map(Number);
  const m2 = Number(validTo.split("-")[1]);
  const plain = html.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  // Exige la date du samedi attendu dans l'en-tête de semaine (sinon tableau périmé).
  const want = new RegExp(`du\\s+(?:samedi\\s+)?${d1}\\s+${MONTHS[m1 - 1]}(?:\\s+${y})?\\s+au`);
  if (!want.test(plain) || !plain.includes(String(y)) || m2 < m1 - 11) return [];
  const out: GardeExtraImage[] = [];
  for (const m of html.matchAll(/(?:https:\/\/conseil987\.ordre\.medecin\.fr)?\/sites\/default\/files\/[^"'\s]+\.(?:png|jpe?g)/gi)) {
    const url = m[0].startsWith("http") ? m[0] : `https://conseil987.ordre.medecin.fr${m[0]}`;
    if (!out.some((o) => o.url === url)) out.push({ url, source: "ordre-medecins-987", pageUrl: ORDRE_GARDES_URL });
  }
  return out;
}

export async function fetchExtraGardeImages(validFrom: string, validTo: string): Promise<GardeExtraImage[]> {
  const [a, b] = await Promise.all([
    fetchOrdreMedecinsGardeImages(validFrom, validTo).catch(() => []),
    fetchTntvGardeImages(validFrom, validTo).catch(() => []),
  ]);
  return [...a, ...b];
}
