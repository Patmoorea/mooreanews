/**
 * Article actualités pour le récap semaine MooreaNews.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import { resolvePosterCoverUrl } from "@/lib/garde-poster-url";
import type { WeeklyRecapSnapshot } from "@/lib/weekly-recap-data";
import { weeklyRecapArticleSlug } from "@/lib/weekly-recap-data";

export function buildWeeklyRecapTitle(snap: WeeklyRecapSnapshot): string {
  return `Agenda & actu — semaine du ${snap.label}`;
}

export function buildWeeklyRecapExcerpt(snap: WeeklyRecapSnapshot): string {
  const parts: string[] = [];
  if (snap.events.length > 0) {
    parts.push(`${snap.events.length} événement${snap.events.length > 1 ? "s" : ""}`);
  }
  if (snap.articles.length > 0) {
    parts.push(`${snap.articles.length} actu${snap.articles.length > 1 ? "s" : ""}`);
  }
  if (parts.length === 0) {
    return `Votre semaine à Moorea (${snap.label}) — agenda et actualités sur MooreaNews.`;
  }
  return `${parts.join(" · ")} — votre semaine à Moorea (${snap.label}).`;
}

export function buildWeeklyRecapBody(snap: WeeklyRecapSnapshot): string {
  const blocks: string[] = [
    `Récapitulatif MooreaNews pour la semaine du ${snap.label}.`,
  ];

  if (snap.events.length > 0) {
    blocks.push(
      "Événements à venir :\n" +
        snap.events
          .map((e) => `• ${e.date} — ${e.title}${e.time ? ` (${e.time})` : ""} — ${e.location}`)
          .join("\n"),
    );
  }

  if (snap.articles.length > 0) {
    blocks.push(
      "Actualités récentes :\n" +
        snap.articles.map((a) => `• ${a.title}`).join("\n"),
    );
  }

  blocks.push(
    "Affiche MooreaNews générée automatiquement chaque lundi matin.",
  );

  return blocks.join("\n\n");
}

export async function upsertWeeklyRecapArticle(
  snap: WeeklyRecapSnapshot,
): Promise<{
  slug: string;
  created: boolean;
  updated: boolean;
  error?: string;
}> {
  const slug = weeklyRecapArticleSlug(snap.weekStart);
  const supabase = getAdminSupabase();
  if (!supabase) {
    return { slug, created: false, updated: false, error: "supabase_admin_missing" };
  }

  const title = buildWeeklyRecapTitle(snap).slice(0, 200);
  const excerpt = buildWeeklyRecapExcerpt(snap).slice(0, 280);
  const body = buildWeeklyRecapBody(snap);
  const coverUrl = resolvePosterCoverUrl(snap.posterImageUrl, snap.syncedAt);
  const publishedAt = `${snap.weekStart}T07:00:00.000Z`;

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  const row = {
    slug,
    title,
    excerpt,
    body,
    category: "culture",
    tags: ["agenda-semaine", "moorea", "hebdo"],
    cover_url: coverUrl,
    author: "MooreaNews",
    featured: true,
    published: true,
    published_at: publishedAt,
  };

  if (existing) {
    const { error } = await supabase.from("articles").update(row).eq("slug", slug);
    return { slug, created: false, updated: !error, error: error?.message };
  }

  const { error } = await supabase.from("articles").insert(row);
  if (error?.code === "23505") {
    const { error: updateErr } = await supabase.from("articles").update(row).eq("slug", slug);
    return { slug, created: false, updated: !updateErr, error: updateErr?.message };
  }

  return { slug, created: !error, updated: false, error: error?.message };
}
