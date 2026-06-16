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
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
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

/** Meta/Facebook « gras Unicode » (𝗠𝟯𝗖…) → caractères ASCII normaux. */
export function stripFacebookStyledUnicode(s: string): string {
  let out = "";
  for (const char of s) {
    const cp = char.codePointAt(0)!;
    const mapped = mapMathAlphanumeric(cp);
    out += mapped ?? char;
  }
  return out;
}

function mapMathAlphanumeric(cp: number): string | null {
  if (cp >= 0x1d400 && cp <= 0x1d419) return String.fromCharCode(65 + cp - 0x1d400);
  if (cp >= 0x1d41a && cp <= 0x1d433) return String.fromCharCode(97 + cp - 0x1d41a);
  if (cp >= 0x1d434 && cp <= 0x1d44d) return String.fromCharCode(65 + cp - 0x1d434);
  if (cp >= 0x1d44e && cp <= 0x1d467) return String.fromCharCode(97 + cp - 0x1d44e);
  if (cp >= 0x1d468 && cp <= 0x1d481) return String.fromCharCode(65 + cp - 0x1d468);
  if (cp >= 0x1d482 && cp <= 0x1d49b) return String.fromCharCode(97 + cp - 0x1d482);
  if (cp >= 0x1d56c && cp <= 0x1d585) return String.fromCharCode(65 + cp - 0x1d56c);
  if (cp >= 0x1d586 && cp <= 0x1d59f) return String.fromCharCode(97 + cp - 0x1d586);
  if (cp >= 0x1d5a0 && cp <= 0x1d5b9) return String.fromCharCode(65 + cp - 0x1d5a0);
  if (cp >= 0x1d5ba && cp <= 0x1d5d3) return String.fromCharCode(97 + cp - 0x1d5ba);
  if (cp >= 0x1d5d4 && cp <= 0x1d5ed) return String.fromCharCode(65 + cp - 0x1d5d4);
  if (cp >= 0x1d5ee && cp <= 0x1d607) return String.fromCharCode(97 + cp - 0x1d5ee);
  if (cp >= 0x1d608 && cp <= 0x1d621) return String.fromCharCode(65 + cp - 0x1d608);
  if (cp >= 0x1d622 && cp <= 0x1d63b) return String.fromCharCode(97 + cp - 0x1d622);
  if (cp >= 0x1d63c && cp <= 0x1d655) return String.fromCharCode(65 + cp - 0x1d63c);
  if (cp >= 0x1d656 && cp <= 0x1d66f) return String.fromCharCode(97 + cp - 0x1d656);
  if (cp >= 0x1d670 && cp <= 0x1d689) return String.fromCharCode(65 + cp - 0x1d670);
  if (cp >= 0x1d68a && cp <= 0x1d6a3) return String.fromCharCode(97 + cp - 0x1d68a);
  if (cp >= 0x1d7ce && cp <= 0x1d7d7) return String.fromCharCode(48 + cp - 0x1d7ce);
  if (cp >= 0x1d7ec && cp <= 0x1d7f5) return String.fromCharCode(48 + cp - 0x1d7ec);
  return null;
}

/** Nettoie le texte importé depuis Facebook / RSS. */
export function cleanImportedText(s: string): string {
  return stripFacebookStyledUnicode(decodeHtmlEntities(s))
    .replace(/\u00a0/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
