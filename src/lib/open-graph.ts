import { isFacebookUrl } from "@/lib/facebook-url";
import { decodeHtmlEntities } from "@/lib/html-entities";

export type OpenGraphData = {
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
};

function extractMeta(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1].trim());
  }
  return null;
}

function extractBestImage(html: string): string | undefined {
  const keys = ["og:image:secure_url", "og:image", "twitter:image"];
  for (const key of keys) {
    const url = extractMeta(html, key);
    if (url?.startsWith("http")) return url;
  }
  return undefined;
}

function cleanFacebookTitle(title: string): string {
  return title.replace(/\s*\|\s*Facebook\s*$/i, "").trim();
}

/**
 * Récupère titre / description / affiche via Open Graph.
 * Facebook : user-agent « facebookexternalhit » (affiche = og:image).
 */
export async function fetchOpenGraph(
  url: string,
): Promise<OpenGraphData | null> {
  const userAgent = isFacebookUrl(url)
    ? "facebookexternalhit/1.1 (+https://www.mooreanews.com)"
    : "Mozilla/5.0 (compatible; MooreaNews/1.0; +https://www.mooreanews.com)";

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
  title = decodeHtmlEntities(
    isFacebookUrl(url) ? cleanFacebookTitle(title) : title.trim(),
  );

  const description = decodeHtmlEntities(
    extractMeta(html, "og:description") ??
      extractMeta(html, "description") ??
      "",
  );

  const imageUrl = extractBestImage(html);

  if (!title) return null;

  return {
    url: ogUrl,
    title: title.slice(0, 500),
    description: description.slice(0, 2000),
    imageUrl,
  };
}
