import { SITE } from "@/lib/constants";

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
