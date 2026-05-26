/**
 * Chargeur de contenu statique depuis /data/*.json.
 * Plus tard : Phase 2, bascule vers Supabase pour le contenu communautaire.
 */

import articlesData from "@/../data/articles.json";
import eventsData from "@/../data/events.json";
import announcementsData from "@/../data/announcements.json";
import restaurantsData from "@/../data/restaurants.json";
import activitiesData from "@/../data/activities.json";
import infoData from "@/../data/info-pratiques.json";

import type {
  Article,
  Event,
  Announcement,
  Restaurant,
  Activity,
  InfoPratique,
} from "@/lib/content-types";

export function getArticles(): Article[] {
  return (articlesData as Article[]).slice().sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getFeaturedArticles(): Article[] {
  return getArticles().filter((a) => a.featured);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getArticles().find((a) => a.slug === slug);
}

export function getEvents(): Event[] {
  return (eventsData as Event[]).slice().sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getUpcomingEvents(limit?: number): Event[] {
  const today = new Date().toISOString().slice(0, 10);
  const items = getEvents().filter((e) => e.date >= today);
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export function getAnnouncements(): Announcement[] {
  return (announcementsData as Announcement[]).slice().sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getRestaurants(): Restaurant[] {
  return restaurantsData as Restaurant[];
}

export function getActivities(): Activity[] {
  return activitiesData as Activity[];
}

export function getInfoPratiques(): InfoPratique[] {
  return infoData as InfoPratique[];
}
