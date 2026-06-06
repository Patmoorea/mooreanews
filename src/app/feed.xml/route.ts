import { buildNewsRssFeed } from "@/lib/rss-export";

export const revalidate = 1800;

export async function GET() {
  const xml = await buildNewsRssFeed(50);
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
