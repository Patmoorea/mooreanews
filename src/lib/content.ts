/**
 * Chargeurs de contenu depuis les fichiers JSON éditables.
 *
 * Les JSON dans /data sont la source de vérité pour la phase 1 MVP.
 * Édition directe sur GitHub via l'interface web : modifier le JSON,
 * commit, et Vercel redéploie automatiquement le site.
 *
 * Phase 2 : migration vers Supabase Postgres.
 */

import articlesData from "../../data/articles.json";
import eventsData from "../../data/events.json";
import restaurantsData from "../../data/restaurants.json";
import activitiesData from "../../data/activities.json";
import announcementsData from "../../data/announcements.json";
import practicalInfoData from "../../data/practical-info.json";

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: string;
  date: string;
  featured: boolean;
  tags: string[];
};

export type Event = {
  slug: string;
  title: string;
  description: string;
  date: string;
  endDate?: string;
  time: string;
  location: string;
  category: string;
  image: string;
  organizer: string;
  phone?: string;
  featured: boolean;
  price: string;
};

export type Restaurant = {
  slug: string;
  name: string;
  type: string;
  description: string;
  location: string;
  phone?: string;
  phoneAlt?: string;
  image: string;
  tags: string[];
  priceRange: string;
  rating: number;
  specialty: string;
};

export type Activity = {
  slug: string;
  name: string;
  provider: string;
  description: string;
  location: string;
  phone?: string;
  price: string;
  duration: string;
  image: string;
  category: string;
  rating: number;
  tags: string[];
  seasonal?: string;
};

export type Announcement = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  location: string;
  phone: string;
  date: string;
  image: string | null;
};

export type PracticalSection = {
  slug: string;
  title: string;
  icon: string;
  items: Array<{
    title: string;
    content: string;
    phone?: string;
    url?: string;
  }>;
};

export function getArticles(): Article[] {
  return [...articlesData.articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getFeaturedArticles(): Article[] {
  return getArticles().filter((a) => a.featured);
}

export function getArticle(slug: string): Article | undefined {
  return articlesData.articles.find((a) => a.slug === slug);
}

export function getEvents(): Event[] {
  return [...eventsData.events]
    .filter((e) => new Date(e.endDate ?? e.date).getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getFeaturedEvents(): Event[] {
  return getEvents().filter((e) => e.featured);
}

export function getEvent(slug: string): Event | undefined {
  return eventsData.events.find((e) => e.slug === slug);
}

export function getRestaurants(): Restaurant[] {
  return restaurantsData.restaurants;
}

export function getRestaurant(slug: string): Restaurant | undefined {
  return restaurantsData.restaurants.find((r) => r.slug === slug);
}

export function getActivities(): Activity[] {
  return activitiesData.activities;
}

export function getActivity(slug: string): Activity | undefined {
  return activitiesData.activities.find((a) => a.slug === slug);
}

export function getAnnouncements(): Announcement[] {
  return [...announcementsData.announcements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPracticalInfo(): PracticalSection[] {
  return practicalInfoData.sections;
}
