import { getArticles } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { absoluteUrl, toAbsoluteMediaUrl } from "@/lib/seo";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Flux RSS public — Google, lecteurs, partage. */
export async function buildNewsRssFeed(limit = 50): Promise<string> {
  const articles = (await getArticles()).slice(0, limit);
  const feedUrl = absoluteUrl("/feed.xml");
  const home = absoluteUrl("/");

  const items = articles
    .map((article) => {
      const link = absoluteUrl(`/actualites/${article.slug}`);
      const image = toAbsoluteMediaUrl(article.image);
      const pubDate = new Date(article.publishedAt).toUTCString();
      const description = escapeXml(article.excerpt.slice(0, 600));
      const enclosure = image
        ? `\n      <enclosure url="${escapeXml(image)}" type="image/jpeg"/>`
        : "";

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>${enclosure}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${SITE.name} — Actualités Moorea`)}</title>
    <link>${home}</link>
    <description>${escapeXml(SITE.description)}</description>
    <language>fr-pf</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
