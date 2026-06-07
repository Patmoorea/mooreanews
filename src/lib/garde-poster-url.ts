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
