/**
 * Requêtes Supabase typées pour les contenus publics.
 * Toutes ces fonctions s'exécutent côté serveur.
 * Renvoient null si Supabase n'est pas configuré (le caller doit fallback).
 */

import {
  getPublicSupabase,
  getServerSupabase,
} from "@/lib/supabase/server";
import type {
  ArticleRow,
  EventRow,
  AnnouncementRow,
  RestaurantRow,
  ActivityRow,
  InfoRow,
  AlertRow,
} from "@/lib/supabase/types";

export async function dbListArticles(): Promise<ArticleRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  return data;
}

export async function dbGetArticleBySlug(
  slug: string
): Promise<ArticleRow | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return data;
}

export async function dbListEvents(): Promise<EventRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: true });
  return data;
}

export async function dbListAnnouncements(): Promise<AnnouncementRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });
  return data;
}

export async function dbListRestaurants(): Promise<RestaurantRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("restaurants")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false });
  return data;
}

export async function dbListActivities(): Promise<ActivityRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("published", true)
    .order("featured", { ascending: false });
  return data;
}

export async function dbListInfoPratiques(): Promise<InfoRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("info_pratiques")
    .select("*")
    .eq("published", true)
    .order("display_order", { ascending: true });
  return data;
}

/**
 * Stats pour le dashboard admin.
 */
export async function dbGetAdminStats(): Promise<{
  articles: number;
  events: number;
  announcements: number;
  restaurants: number;
  activities: number;
  infoPratiques: number;
  alerts: number;
  urgentAlerts: number;
  pendingSubmissions: number;
  newsletterSubscribers: number;
} | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const [articles, events, anns, restos, acts, infos, alerts, urgentAlerts, subs, news] =
    await Promise.all([
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("announcements").select("id", { count: "exact", head: true }),
    supabase.from("restaurants").select("id", { count: "exact", head: true }),
    supabase.from("activities").select("id", { count: "exact", head: true }),
    supabase.from("info_pratiques").select("id", { count: "exact", head: true }),
    supabase.from("alerts").select("id", { count: "exact", head: true }),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .eq("urgent", true),
    supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("confirmed", true),
  ]);

  return {
    articles: articles.count ?? 0,
    events: events.count ?? 0,
    announcements: anns.count ?? 0,
    restaurants: restos.count ?? 0,
    activities: acts.count ?? 0,
    infoPratiques: infos.count ?? 0,
    alerts: alerts.count ?? 0,
    urgentAlerts: urgentAlerts.count ?? 0,
    pendingSubmissions: subs.count ?? 0,
    newsletterSubscribers: news.count ?? 0,
  };
}

export async function dbListActiveAlerts(): Promise<AlertRow[] | null> {
  const supabase = getPublicSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .eq("active", true)
    .order("urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);
  return data;
}

export async function dbListAdminAlerts(): Promise<AlertRow[] | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("alerts")
    .select("*")
    .order("active", { ascending: false })
    .order("urgent", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  return data;
}
