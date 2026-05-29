/**
 * Décode les entités HTML (nom, décimal, hex) — texte Meta / Open Graph.
 */
export function decodeHtmlEntities(s: string): string {
  if (!s) return s;

  let out = s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ");

  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
    const cp = Number.parseInt(hex, 16);
    return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
  });

  out = out.replace(/&#(\d+);/g, (_, num: string) => {
    const cp = Number.parseInt(num, 10);
    return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
  });

  return out;
}

/** Nettoie le texte importé depuis Facebook / RSS. */
export function cleanImportedText(s: string): string {
  return decodeHtmlEntities(s)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
