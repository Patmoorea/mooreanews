import { getArticles } from "@/lib/content";
import { SITE } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import { articlePath, excludeFromSitemap, latestGardeSlug } from "@/lib/article-url";

export const revalidate = 1800;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Sitemap Google Actualités : articles des dernières 48 h (max 1000). */
export async function GET() {
  const articles = await getArticles();
  const latestGarde = latestGardeSlug(articles);
  const cutoff = Date.now() - 48 * 3600 * 1000;
  const recent = articles
    .filter((a) => new Date(a.publishedAt).getTime() >= cutoff)
    .filter((a) => !excludeFromSitemap(a, latestGarde))
    .slice(0, 1000);

  const urls = recent
    .map(
      (a) => `  <url>
    <loc>${escapeXml(absoluteUrl(articlePath(a)))}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE.name)}</news:name>
        <news:language>fr</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.publishedAt).toISOString()}</news:publication_date>
      <news:title>${escapeXml(a.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
