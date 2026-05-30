/**
 * Chargeur de contenu : Supabase si configuré, sinon fallback sur /data/*.json.
 * Toutes les fonctions sont async et exécutées côté serveur.
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

import {
  dbListArticles,
  dbGetArticleBySlug,
  dbListEvents,
  dbListAnnouncements,
  dbListRestaurants,
  dbListActivities,
  dbListInfoPratiques,
} from "@/lib/supabase/queries";
import {
  mergeInfoPratiqueCatalog,
  normalizeInfoTitle,
} from "@/lib/info-catalog";

import type {
  ArticleRow,
  EventRow,
  AnnouncementRow,
  RestaurantRow,
  ActivityRow,
  InfoRow,
} from "@/lib/supabase/types";
import { normalizeTitleKey } from "@/lib/cover-image";

// =====================================================================
// Articles
// =====================================================================

export async function getArticles(): Promise<Article[]> {
  const db = await dbListArticles();
  if (db) return db.map(articleFromRow);
  return (articlesData as Article[])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const all = await getArticles();
  return all.filter((a) => a.featured);
}

export async function getArticleBySlug(
  slug: string
): Promise<Article | undefined> {
  const db = await dbGetArticleBySlug(slug);
  if (db) return articleFromRow(db);
  return (articlesData as Article[]).find((a) => a.slug === slug);
}

// =====================================================================
// Events
// =====================================================================

export async function getEvents(): Promise<Event[]> {
  const db = await dbListEvents();
  if (db) return db.map(eventFromRow);
  return (eventsData as Event[])
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getUpcomingEvents(limit?: number): Promise<Event[]> {
  const today = new Date().toISOString().slice(0, 10);
  const all = await getEvents();
  const items = all.filter((e) => e.date >= today);
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

/** Événements dans une plage de dates (séjour visiteur). */
export async function getEventsBetween(
  startDate: string,
  endDate: string,
): Promise<Event[]> {
  const all = await getEvents();
  return all.filter((e) => e.date >= startDate && e.date <= endDate);
}

export async function getEventBySlug(
  slug: string,
): Promise<Event | undefined> {
  const all = await getEvents();
  return all.find((e) => e.slug === slug);
}

// =====================================================================
// Announcements
// =====================================================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const db = await dbListAnnouncements();
  const items = db
    ? db.map(announcementFromRow)
    : (announcementsData as Announcement[]);
  return items.slice().sort((a, b) => {
    const aBoost = a.boosted ? 1 : 0;
    const bBoost = b.boosted ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    return (
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  });
}

export async function getAnnouncementBySlug(
  slug: string,
): Promise<Announcement | undefined> {
  const all = await getAnnouncements();
  return all.find((a) => a.slug === slug);
}

// =====================================================================
// Restaurants
// =====================================================================

export async function getRestaurants(): Promise<Restaurant[]> {
  const db = await dbListRestaurants();
  // En prod (Supabase configuré), la base est la seule source : une suppression
  // admin ne doit pas être annulée par le fallback JSON.
  if (db) return db.map(restaurantFromRow);
  return restaurantsData as Restaurant[];
}

export async function getRestaurantBySlug(
  slug: string,
): Promise<Restaurant | undefined> {
  const all = await getRestaurants();
  return all.find((r) => r.slug === slug);
}

// =====================================================================
// Activities
// =====================================================================

export async function getActivities(): Promise<Activity[]> {
  const db = await dbListActivities();
  if (db) return db.map(activityFromRow);
  return activitiesData as Activity[];
}

export async function getActivityBySlug(
  slug: string,
): Promise<Activity | undefined> {
  const all = await getActivities();
  return all.find((a) => a.slug === slug);
}

// =====================================================================
// Infos pratiques
// =====================================================================

const INFO_CATEGORY_ORDER: Record<InfoPratique["category"], number> = {
  urgence: 0,
  sante: 1,
  transport: 2,
  administration: 3,
  education: 4,
  commerce: 5,
};

function sortInfoPratiques(items: InfoPratique[]): InfoPratique[] {
  return items.slice().sort((a, b) => {
    const cat =
      INFO_CATEGORY_ORDER[a.category] - INFO_CATEGORY_ORDER[b.category];
    if (cat !== 0) return cat;
    return a.title.localeCompare(b.title, "fr");
  });
}

/** Catalogue JSON toujours fusionné avec Supabase (slugs stables, ex. RAI TAHITI). */
export async function getInfoPratiques(): Promise<InfoPratique[]> {
  const json = infoData as InfoPratique[];
  const db = await dbListInfoPratiques();
  if (!db) return sortInfoPratiques(json);
  const dbItems = db.map(infoFromRow);
  return sortInfoPratiques(mergeInfoPratiqueCatalog(dbItems, json));
}

export async function getInfoPratiqueBySlug(
  slug: string,
): Promise<InfoPratique | undefined> {
  const jsonItem = (infoData as InfoPratique[]).find((i) => i.slug === slug);
  const all = await getInfoPratiques();
  const fromList = all.find((i) => i.slug === slug);
  if (fromList) return fromList;
  if (jsonItem) {
    const byTitle = all.find(
      (i) => normalizeInfoTitle(i.title) === normalizeInfoTitle(jsonItem.title),
    );
    return byTitle ?? jsonItem;
  }
  return undefined;
}

/** Slugs stables pour pré-génération (JSON + base). */
export async function getAllInfoPratiqueSlugs(): Promise<string[]> {
  const json = infoData as InfoPratique[];
  const all = await getInfoPratiques();
  return [...new Set([...json.map((i) => i.slug), ...all.map((i) => i.slug)])];
}

// =====================================================================
// Mapping Row (Supabase) → Type (front)
// =====================================================================

function articleFromRow(r: ArticleRow): Article {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    category: r.category as Article["category"],
    tags: r.tags ?? undefined,
    image: r.cover_url ?? undefined,
    author: r.author ?? undefined,
    featured: r.featured,
    publishedAt: r.published_at,
  };
}

const ICPF_AFFICHE = "/images/events/depistage-cancer-peau-icpf-2026.jpg";

/** Affiches locales quand cover_url n’est pas encore en base (clé = titre normalisé). */
const EVENT_TITLE_COVERS: Record<string, string> = {
  "depistage de la peau": ICPF_AFFICHE,
};

function eventCoverFromRow(r: EventRow): string | undefined {
  const url = r.cover_url?.trim();
  if (url) return url;
  const key = normalizeTitleKey(r.title);
  if (EVENT_TITLE_COVERS[key]) return EVENT_TITLE_COVERS[key];
  if (key.includes("depistage") && key.includes("peau")) return ICPF_AFFICHE;
  return undefined;
}

function eventFromRow(r: EventRow): Event {
  return {
    slug: r.id,
    title: r.title,
    description: r.description,
    category: r.category as Event["category"],
    date: r.date,
    endDate: r.end_date ?? undefined,
    time: r.start_time ?? undefined,
    location: r.location,
    district: r.district ?? undefined,
    organizer: r.organizer ?? undefined,
    price: r.price ?? undefined,
    contact: r.contact ?? undefined,
    url: r.url ?? undefined,
    image: eventCoverFromRow(r),
  };
}

function announcementFromRow(r: AnnouncementRow): Announcement {
  const boosted =
    r.boosted_until != null && new Date(r.boosted_until).getTime() > Date.now();
  return {
    slug: r.id,
    title: r.title,
    body: r.body,
    type: (r.category as Announcement["type"]) ?? "service",
    district: r.district ?? undefined,
    price: r.price ?? undefined,
    contact: r.contact ?? "",
    publishedAt: r.created_at,
    image: r.cover_url ?? undefined,
    boosted,
  };
}

function restaurantFromRow(r: RestaurantRow): Restaurant {
  return {
    slug: r.id,
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    priceLevel: priceLevelFromRange(r.price_range),
    district: r.district,
    address: r.address,
    phone: r.phone ?? undefined,
    website: r.url ?? undefined,
    openingHours: r.hours ?? undefined,
    image: r.cover_url ?? undefined,
    premium: r.featured,
    lat: r.lat ?? undefined,
    lon: r.lon ?? undefined,
  };
}

function priceLevelFromRange(range: string | null): 1 | 2 | 3 | 4 {
  if (!range) return 2;
  const n = Number.parseInt(range, 10);
  if (n >= 1 && n <= 4) return n as 1 | 2 | 3 | 4;
  const symbols = (range.match(/€|\$/g) ?? []).length;
  return Math.min(4, Math.max(1, symbols || 2)) as 1 | 2 | 3 | 4;
}

function activityFromRow(r: ActivityRow): Activity {
  return {
    slug: r.id,
    name: r.name,
    description: r.description,
    category: r.category as Activity["category"],
    district: r.district ?? undefined,
    duration: r.duration ?? undefined,
    price: r.price ?? undefined,
    contact: r.phone ?? undefined,
    website: r.url ?? undefined,
    image: r.cover_url ?? undefined,
    lat: r.lat ?? undefined,
    lon: r.lon ?? undefined,
  };
}

function infoFromRow(r: InfoRow): InfoPratique {
  const jsonMatch = (infoData as InfoPratique[]).find(
    (j) => j.title.trim().toLowerCase() === r.title.trim().toLowerCase(),
  );
  return {
    slug: jsonMatch?.slug ?? r.id,
    title: r.title,
    description: r.description,
    category: r.category as InfoPratique["category"],
    address: r.address ?? undefined,
    phone: r.phone ?? undefined,
    hours: r.hours ?? undefined,
    website: r.url ?? undefined,
    image: jsonMatch?.image,
    lat: r.lat ?? jsonMatch?.lat,
    lon: r.lon ?? jsonMatch?.lon,
    mapIconUrl: r.map_icon_url ?? jsonMatch?.mapIconUrl,
  };
}
