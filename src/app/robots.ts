import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/seo";

/**
 * Crawlers d'IA et SEO agressifs. Googlebot, Bingbot et les aperçus
 * Facebook (facebookexternalhit), WhatsApp et X (Twitterbot) restent sur la règle `*`.
 */
const BLOCKED_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "CCBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-Web",
  "anthropic-ai",
  "Bytespider",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
  "Amazonbot",
  "DataForSeoBot",
  "BLEXBot",
  "SeekportBot",
  "serpstatbot",
  "SEOkicks",
  "Barkrowler",
  "ZoominfoBot",
  "ImagesiftBot",
  "TikTokSpider",
  "Diffbot",
  "meta-externalagent",
  "PerplexityBot",
  "YouBot",
  "Cohere-ai",
  "AI2Bot",
  "Applebot-Extended",
  "magpie-crawler",
] as const;

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      ...BLOCKED_BOTS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/auth/",
          "/app",
          "/mon-compte",
          "/recherche",
        ],
      },
    ],
    sitemap: [`${origin}/sitemap.xml`, `${origin}/news-sitemap.xml`],
    host: origin,
  };
}
