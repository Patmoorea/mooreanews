/**
 * Logos d’épingle carte (slug stable ou URL admin).
 */

export const MAP_MARKER_LOGOS: Record<string, string> = {
  "rai-tahiti-vsl": "/partners/logo.png",
};

export function resolveMapIconUrl(
  slug: string,
  mapIconUrl?: string | null,
): string | undefined {
  const custom = mapIconUrl?.trim();
  if (custom) return custom;
  return MAP_MARKER_LOGOS[slug];
}
