import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { getArticles } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const baseRoutes = [
    { path: "", priority: 1, freq: "hourly" as const },
    { path: "/actualites", priority: 0.9, freq: "daily" as const },
    { path: "/evenements", priority: 0.9, freq: "daily" as const },
    { path: "/annonces", priority: 0.8, freq: "daily" as const },
    { path: "/restaurants", priority: 0.8, freq: "weekly" as const },
    { path: "/activites", priority: 0.8, freq: "weekly" as const },
    { path: "/infos-pratiques", priority: 0.7, freq: "weekly" as const },
    { path: "/soumettre", priority: 0.7, freq: "monthly" as const },
    { path: "/contact", priority: 0.6, freq: "monthly" as const },
    { path: "/a-propos", priority: 0.5, freq: "monthly" as const },
    { path: "/mentions-legales", priority: 0.2, freq: "yearly" as const },
    { path: "/confidentialite", priority: 0.2, freq: "yearly" as const },
  ];

  const articles = await getArticles();
  const articleRoutes = articles.map((a) => ({
    url: `${SITE.url}/actualites/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...baseRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...articleRoutes,
  ];
}
