/**
 * Publie automatiquement certains flux RSS en actualités MooreaNews.
 * Sources configurées via `autoPublishAsArticles` dans rss-sources.ts.
 * Désactiver globalement : RSS_AUTO_PUBLISH_AS_ARTICLES=false
 */

import { createHash } from "crypto";
import type { RssItem } from "@/lib/rss-parser";
import type { RssSource } from "@/lib/rss-sources";
import { getAdminSupabase } from "@/lib/supabase/admin";

export type RssArticleImportResult = {
  created: number;
  skipped: number;
  errors: string[];
  createdArticles: { title: string; slug: string }[];
};

const DEFAULT_MAX_AGE_DAYS = 30;

function importEnabled(): boolean {
  return process.env.RSS_AUTO_PUBLISH_AS_ARTICLES !== "false";
}

function maxAgeDays(): number {
  const raw = process.env.RSS_ARTICLE_MAX_AGE_DAYS?.trim();
  const n = raw ? Number(raw) : DEFAULT_MAX_AGE_DAYS;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_AGE_DAYS;
}

function slugForRssItem(sourceId: string, guid: string): string {
  const hash = createHash("sha256")
    .update(`${sourceId}:${guid}`)
    .digest("hex")
    .slice(0, 12);
  return `rss-${sourceId}-${hash}`;
}

function buildBody(item: RssItem, source: RssSource): string {
  const text = item.description.trim();
  const footer = `\n\n---\n\nSource : [${source.name}](${item.link})`;
  return text
    ? `${text}${footer}`
    : `Article repéré sur ${source.name}.${footer}`;
}

function isRecentEnough(publishedAt: string): boolean {
  const ms = Date.parse(publishedAt);
  if (Number.isNaN(ms)) return false;
  return Date.now() - ms <= maxAgeDays() * 24 * 60 * 60 * 1000;
}

/** Crée des fiches dans `articles` pour les flux RSS marqués auto-publish. */
export async function importArticlesFromRssItems(
  items: RssItem[],
  source: RssSource,
): Promise<RssArticleImportResult> {
  const result: RssArticleImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
    createdArticles: [],
  };

  if (!source.autoPublishAsArticles || !importEnabled()) return result;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
  }

  for (const item of items) {
    if (!isRecentEnough(item.publishedAt)) continue;

    const title = item.title.trim().slice(0, 200);
    if (title.length < 5) continue;

    const slug = slugForRssItem(source.id, item.guid);

    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      result.skipped += 1;
      continue;
    }

    const excerpt = (item.description.trim() || title).slice(0, 280);

    const { error } = await supabase.from("articles").insert({
      slug,
      title,
      excerpt,
      body: buildBody(item, source),
      category: "actualites",
      tags: ["rss-import", source.id],
      cover_url: item.imageUrl?.trim() || null,
      author: item.author?.trim() || source.name,
      featured: false,
      published: true,
      published_at: item.publishedAt,
    });

    if (error) {
      if (error.code === "23505") {
        result.skipped += 1;
      } else {
        result.errors.push(`${source.id}/${item.guid.slice(0, 40)}: ${error.message}`);
      }
      continue;
    }

    await supabase
      .from("external_articles")
      .update({ hidden: true })
      .eq("source_id", source.id)
      .eq("external_id", item.guid);

    result.created += 1;
    result.createdArticles.push({ title, slug });
  }

  return result;
}
