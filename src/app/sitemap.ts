import type { MetadataRoute } from "next";
import { getVisitorAccommodations } from "@/lib/accommodations";
import {
  getActivities,
  getAnnouncements,
  getArticles,
  getEvents,
  getInfoPratiques,
  getRestaurants,
} from "@/lib/content";
import { absoluteUrl, STATIC_SITEMAP_PATHS } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [articles, events, restaurants, annonces, activites, infos, hebergements] =
    await Promise.all([
      getArticles(),
      getEvents(),
      getRestaurants(),
      getAnnouncements(),
      getActivities(),
      getInfoPratiques(),
      getVisitorAccommodations(),
    ]);

  const staticRoutes = STATIC_SITEMAP_PATHS.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...articles.map((a) => ({
      url: absoluteUrl(`/actualites/${a.slug}`),
      lastModified: new Date(a.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...events.map((e) => ({
      url: absoluteUrl(`/evenements/${e.slug}`),
      lastModified: new Date(e.date),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...restaurants.map((r) => ({
      url: absoluteUrl(`/restaurants/${r.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    ...annonces.map((a) => ({
      url: absoluteUrl(`/annonces/${a.slug}`),
      lastModified: new Date(a.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    })),
    ...activites.map((a) => ({
      url: absoluteUrl(`/activites/${a.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...infos.map((i) => ({
      url: absoluteUrl(`/infos-pratiques/${i.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
    ...hebergements.map((h) => ({
      url: absoluteUrl(`/hebergements/${h.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
