/**
 * Flux RSS sortant — actualités MooreaNews (Google News, agrégateurs, lecteurs).
 */

import type { Article } from "@/lib/content-types";
import { SITE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function itemImageEnclosure(image?: string | null): string {
  if (!image?.trim()) return "";
  const url = image.startsWith("http") ? image : absoluteUrl(image);
  return `<enclosure url="${escapeXml(url)}" type="image/jpeg" />`;
}

/** RSS 2.0 des derniers articles publiés. */
export function buildArticlesRssFeed(articles: Article[], limit = 50): string {
  const origin = absoluteUrl("/");
  const items = articles.slice(0, limit);
  const lastBuild = items[0]?.publishedAt ?? new Date().toISOString();

  const itemXml = items
    .map((a) => {
      const link = absoluteUrl(`/actualites/${a.slug}`);
      const desc = escapeXml(a.excerpt || a.title);
      return `<item>
  <title>${escapeXml(a.title)}</title>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="true">${escapeXml(link)}</guid>
  <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
  <description>${desc}</description>
  ${a.author ? `<author>${escapeXml(a.author)}</author>` : ""}
  ${itemImageEnclosure(a.image)}
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(SITE.name)} — Actualités Moorea</title>
  <link>${escapeXml(origin)}</link>
  <description>${escapeXml(SITE.description)}</description>
  <language>fr-pf</language>
  <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
  <atom:link href="${escapeXml(absoluteUrl("/actualites/feed.xml"))}" rel="self" type="application/rss+xml" />
  <image>
    <url>${escapeXml(absoluteUrl(SITE.logo))}</url>
    <title>${escapeXml(SITE.name)}</title>
    <link>${escapeXml(origin)}</link>
  </image>
${itemXml}
</channel>
</rss>`;
}
