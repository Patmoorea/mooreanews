import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import {
  getActivities,
  getAnnouncements,
  getArticles,
  getEvents,
  getInfoPratiques,
  getRestaurants,
} from "@/lib/content";

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
    { path: "/partenaires", priority: 0.6, freq: "monthly" as const },
    { path: "/contact", priority: 0.6, freq: "monthly" as const },
    { path: "/a-propos", priority: 0.5, freq: "monthly" as const },
    { path: "/mentions-legales", priority: 0.2, freq: "yearly" as const },
    { path: "/confidentialite", priority: 0.2, freq: "yearly" as const },
  ];

  const [articles, events, restaurants, annonces, activites, infos] =
    await Promise.all([
      getArticles(),
      getEvents(),
      getRestaurants(),
      getAnnouncements(),
      getActivities(),
      getInfoPratiques(),
    ]);

  const articleRoutes = articles.map((a) => ({
    url: `${SITE.url}/actualites/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const eventRoutes = events.map((e) => ({
    url: `${SITE.url}/evenements/${e.slug}`,
    lastModified: new Date(e.date),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const restaurantRoutes = restaurants.map((r) => ({
    url: `${SITE.url}/restaurants/${r.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const annonceRoutes = annonces.map((a) => ({
    url: `${SITE.url}/annonces/${a.slug}`,
    lastModified: new Date(a.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  const activiteRoutes = activites.map((a) => ({
    url: `${SITE.url}/activites/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const infoRoutes = infos.map((i) => ({
    url: `${SITE.url}/infos-pratiques/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...baseRoutes.map((r) => ({
      url: `${SITE.url}${r.path}`,
      lastModified: now,
      changeFrequency: r.freq,
      priority: r.priority,
    })),
    ...articleRoutes,
    ...eventRoutes,
    ...restaurantRoutes,
    ...annonceRoutes,
    ...activiteRoutes,
    ...infoRoutes,
  ];
}
