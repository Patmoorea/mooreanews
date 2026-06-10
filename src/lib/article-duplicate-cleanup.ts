/**
 * Suppression des actualités en double (imports Facebook surtout).
 */

import {
  articleDedupeKey,
  facebookPermalinkFromArticleBody,
} from "@/lib/article-dedupe";
import { hideExternalArticlesForArticleSlug } from "@/lib/facebook-external-sync";
import { getAdminSupabase } from "@/lib/supabase/admin";

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

export function isFacebookImportRow(row: ArticleDedupeRow): boolean {
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

function rowToDedupeFields(row: ArticleDedupeRow) {
  return {
    slug: row.slug,
    title: row.title,
    publishedAt: row.published_at,
    image: row.cover_url ?? undefined,
    body: row.body,
  };
}

function groupByDedupeKey(
  rows: ArticleDedupeRow[],
): Map<string, ArticleDedupeRow[]> {
  const groups = new Map<string, ArticleDedupeRow[]>();
  for (const row of rows) {
    const key = articleDedupeKey(rowToDedupeFields(row));
    if (key.startsWith("slug:")) continue;
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
  const removedIds = new Set<string>();

  for (const group of groupByDedupeKey(rows).values()) {
    if (group.length <= 1) continue;
    const fbRows = group.filter(isFacebookImportRow);
    if (fbRows.length < 2) continue;

    const sorted = [...group].sort(
      (a, b) => articleRowScore(b) - articleRowScore(a),
    );
    const keep = sorted[0];
    const remove = sorted
      .slice(1)
      .filter(isFacebookImportRow)
      .filter((r) => r.id !== keep.id);

    const toRemove = remove.filter((r) => !removedIds.has(r.id));
    if (toRemove.length === 0) continue;

    for (const r of toRemove) removedIds.add(r.id);
    plans.push({ keep, remove: toRemove });
  }

  return plans;
}

export function countDuplicateArticlesFromRows(rows: ArticleDedupeRow[]): number {
  return planDuplicateArticleCleanup(rows).reduce(
    (n, plan) => n + plan.remove.length,
    0,
  );
}

async function listArticlesForDedupe(): Promise<ArticleDedupeRow[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];
  const { data } = await admin
    .from("articles")
    .select(
      "id, slug, title, excerpt, body, cover_url, published, published_at, tags",
    )
    .order("published_at", { ascending: false });
  return (data ?? []) as ArticleDedupeRow[];
}

export async function countDuplicateArticles(): Promise<number> {
  const rows = await listArticlesForDedupe();
  return countDuplicateArticlesFromRows(rows);
}

export async function purgeDuplicateArticles(): Promise<{
  deleted: number;
  groups: number;
}> {
  const admin = getAdminSupabase();
  if (!admin) return { deleted: 0, groups: 0 };

  const rows = await listArticlesForDedupe();
  const plans = planDuplicateArticleCleanup(rows);
  let deleted = 0;

  for (const plan of plans) {
    for (const row of plan.remove) {
      if (row.slug) await hideExternalArticlesForArticleSlug(row.slug);
      const { error } = await admin.from("articles").delete().eq("id", row.id);
      if (!error) deleted += 1;
    }
  }

  return { deleted, groups: plans.length };
}
