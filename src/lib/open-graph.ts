import { isFacebookUrl } from "@/lib/facebook-url";

export type OpenGraphData = {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
};

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function cleanFacebookTitle(title: string): string {
  return title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();
}

/**
 * Récupère titre / description / image via balises Open Graph.
 * Facebook : user-agent « facebookexternalhit » (seul moyen fiable sans API Meta).
 */
export async function fetchOpenGraph(
  url: string
): Promise<OpenGraphData | null> {
  const userAgent = isFacebookUrl(url)
    ? "facebookexternalhit/1.1 (+https://mooreanews.com)"
    : "MooreaHub/1.0 (+https://mooreanews.com)";

  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent,
      Accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!res.ok) return null;

  const html = await res.text();
  const ogUrl = extractMeta(html, "og:url") ?? url;
  let title =
    extractMeta(html, "og:title") ??
    extractMeta(html, "twitter:title") ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ??
    "";
  title = isFacebookUrl(url) ? cleanFacebookTitle(title) : title.trim();

  const description =
    extractMeta(html, "og:description") ??
    extractMeta(html, "description") ??
    "";

  const imageUrl =
    extractMeta(html, "og:image") ??
    extractMeta(html, "twitter:image") ??
    undefined;

  if (!title) return null;

  return {
    url: ogUrl,
    title: title.slice(0, 500),
    description: description.slice(0, 400),
    imageUrl,
  };
}
