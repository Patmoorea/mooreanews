/**
 * Suppression des actualités en double (imports Facebook surtout).
 */

import {
  articleDisplayDedupeKey,
  facebookPermalinkFromArticleBody,
} from "@/lib/article-dedupe";
import { hideExternalArticlesForArticleSlug } from "@/lib/facebook-external-sync";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ArticleDedupeRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  published: boolean;
  published_at: string;
  tags: string[] | null;
};

function isFacebookImport(row: ArticleDedupeRow): boolean {
  if (row.slug.includes("-fb-")) return true;
  return (row.tags ?? []).includes("facebook-import");
}

function articleRowScore(row: ArticleDedupeRow): number {
  let score = 0;
  const cover = row.cover_url?.trim() ?? "";
  if (cover && !cover.includes("fbcdn.net")) score += 25;
  else if (cover) score += 10;
  score += Math.min(row.body.length, 800) / 20;
  score += Math.min(row.excerpt.length, 280) / 30;
  if (row.published) score += 8;
  if (facebookPermalinkFromArticleBody(row.body)) score += 3;
  score += Date.parse(row.published_at) / 1e15;
  return score;
}

async function listArticlesForDedupe(
  client?: SupabaseClient<Database> | null,
): Promise<ArticleDedupeRow[]> {
  const supabase = client ?? getAdminSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, body, cover_url, published, published_at, tags",
    )
    .order("published_at", { ascending: false });
  return (data ?? []) as ArticleDedupeRow[];
}

function groupByDedupeKey(
  rows: ArticleDedupeRow[],
): Map<string, ArticleDedupeRow[]> {
  const groups = new Map<string, ArticleDedupeRow[]>();
  for (const row of rows) {
    const key = articleDisplayDedupeKey({
      slug: row.slug,
      title: row.title,
      publishedAt: row.published_at,
      image: row.cover_url ?? undefined,
      body: row.body,
    });
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return groups;
}

export type DuplicateArticlePlan = {
  keep: ArticleDedupeRow;
  remove: ArticleDedupeRow[];
};

/** Plan de nettoyage : garde la fiche la plus complète, supprime les doublons Facebook. */
export function planDuplicateArticleCleanup(
  rows: ArticleDedupeRow[],
): DuplicateArticlePlan[] {
  const plans: DuplicateArticlePlan[] = [];
  for (const group of groupByDedupeKey(rows).values()) {
    if (group.length <= 1) continue;
    const fbRows = group.filter(isFacebookImport);
    if (fbRows.length < 2) continue;
    const sorted = [...group].sort(
      (a, b) => articleRowScore(b) - articleRowScore(a),
    );
    const keep = sorted[0];
    const remove = sorted.slice(1).filter(isFacebookImport);
    if (remove.length === 0) continue;
    plans.push({ keep, remove });
  }
  return plans;
}

export function countDuplicateArticlesFromRows(rows: ArticleDedupeRow[]): number {
  return planDuplicateArticleCleanup(rows).reduce(
    (n, plan) => n + plan.remove.length,
    0,
  );
}

export async function countDuplicateArticles(
  client?: SupabaseClient<Database> | null,
): Promise<number> {
  const rows = await listArticlesForDedupe(client);
  return countDuplicateArticlesFromRows(rows);
}

export async function purgeDuplicateArticles(
  client?: SupabaseClient<Database> | null,
): Promise<{
  deleted: number;
  groups: number;
}> {
  const supabase = client ?? getAdminSupabase();
  if (!supabase) return { deleted: 0, groups: 0 };

  const rows = await listArticlesForDedupe(supabase);
  const plans = planDuplicateArticleCleanup(rows);
  let deleted = 0;

  for (const plan of plans) {
    for (const row of plan.remove) {
      if (row.slug) await hideExternalArticlesForArticleSlug(row.slug);
      const { error } = await supabase.from("articles").delete().eq("id", row.id);
      if (!error) deleted += 1;
    }
  }

  return { deleted, groups: plans.length };
}

export function articleRowToDedupeRow(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  published: boolean;
  published_at: string;
  tags: string[] | null;
}): ArticleDedupeRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    cover_url: row.cover_url,
    published: row.published,
    published_at: row.published_at,
    tags: row.tags,
  };
}
