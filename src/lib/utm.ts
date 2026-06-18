/**
 * Liens avec paramètres UTM pour mesurer les campagnes (Facebook, WhatsApp, etc.).
 */

export type UtmParams = {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

export function withUtm(url: string, params: UtmParams): string {
  try {
    const u = new URL(url, "https://www.mooreanews.com");
    u.searchParams.set("utm_source", params.source);
    u.searchParams.set("utm_medium", params.medium ?? "social");
    if (params.campaign) u.searchParams.set("utm_campaign", params.campaign);
    if (params.content) u.searchParams.set("utm_content", params.content);
    return u.toString();
  } catch {
    return url;
  }
}

/** Liens site avec UTM pour publications Facebook / Instagram. */
export function siteLinkUtm(
  path: string,
  source: "facebook" | "instagram" | "whatsapp" | "telegram" | "newsletter",
  campaign = "mooreanews_organic",
): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.mooreanews.com";
  const pathNorm = path.startsWith("/") ? path : `/${path}`;
  return withUtm(`${base}${pathNorm}`, {
    source,
    medium: source === "newsletter" ? "email" : "social",
    campaign,
  });
}

export function parseUtmFromSearch(search: string): UtmParams | null {
  const params = new URLSearchParams(search);
  const source = params.get("utm_source")?.trim();
  if (!source) return null;
  return {
    source,
    medium: params.get("utm_medium")?.trim() || undefined,
    campaign: params.get("utm_campaign")?.trim() || undefined,
    content: params.get("utm_content")?.trim() || undefined,
  };
}

export function utmReferrerLabel(utm: UtmParams): string {
  const labels: Record<string, string> = {
    facebook: "Facebook (campagne)",
    instagram: "Instagram (campagne)",
    whatsapp: "WhatsApp (campagne)",
    telegram: "Telegram (campagne)",
    newsletter: "Newsletter (campagne)",
    google: "Google (campagne)",
  };
  const base = labels[utm.source.toLowerCase()] ?? `UTM: ${utm.source}`;
  return utm.campaign ? `${base} — ${utm.campaign}` : base;
}
