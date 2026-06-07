import { NextResponse } from "next/server";
import { getArticles } from "@/lib/content";
import { buildArticlesRssFeed } from "@/lib/rss-export";

export const revalidate = 600;

/** Alias legacy — le flux canonique est /actualites/feed.xml */
export async function GET() {
  const articles = await getArticles();
  const xml = buildArticlesRssFeed(articles, 50);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
