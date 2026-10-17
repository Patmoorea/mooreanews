import { SITE } from "@/lib/constants";

/** Image Facebook ou affiche communale : jamais une source visuelle de la garde. */
export function isCommuneOrFacebookGardeAsset(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("communemooreamaiao") ||
    u.includes("commune-moorea") ||
    u.includes("fbcdn.net") ||
    u.includes("fbsbx.com") ||
    u.includes("facebook.com") ||
    u.includes("fb.com")
  );
}

/**
 * Affiche publique MooreaNews.
 * Ignore les images commune / Facebook et le tableau Polynésie entier.
 */
export function pickPublicGardePosterUrl(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const raw = candidate?.trim();
    if (!raw) continue;
    if (isCommuneOrFacebookGardeAsset(raw)) continue;
    if (raw.includes("ordre-pharmaciens")) continue;
    return raw;
  }
  return null;
}

/** URL absolue pour affiche (article cover, og, page garde). */
export function resolveGardePosterPublicUrl(
  url: string | null | undefined,
): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("/")) {
    return `${SITE.url.replace(/\/$/, "")}${raw}`;
  }
  return raw;
}

/** Évite le cache Next/Supabase quand l’affiche est régénérée (même chemin). */
export function resolvePosterCoverUrl(
  url: string | null | undefined,
  version: string,
): string | null {
  const base = resolveGardePosterPublicUrl(url);
  if (!base) return null;
  const v = version.replace(/[^0-9A-Za-z-]/g, "").slice(0, 24) || "1";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${v}`;
}
