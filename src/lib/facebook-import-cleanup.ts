/**
 * Suppression des imports Facebook obsolètes ou vides (cron + admin).
 */

import {
  isStaleFacebookImportRow,
  isEmptyFacebookArticleShell,
} from "@/lib/facebook-import-filters";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { isStaleFacebookEvent } from "@/lib/facebook-event-filters";

async function hideExternalArticlesForArticleSlug(slug: string): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;
  await admin
    .from("external_articles")
    .update({ hidden: true })
    .ilike("external_id", `%${slug}%`);
}

/** Supprime les fiches Facebook trop vieilles, vides ou sans année détectable dans le texte. */
export async function purgeStaleFacebookImports(): Promise<{
  deleted: number;
}> {
  const admin = getAdminSupabase();
  if (!admin) return { deleted: 0 };

  const { data: tagged } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url")
    .filter("tags", "cs", "{facebook-import}");

  const { data: bySlug } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url")
    .ilike("slug", "%-fb-%");

  const seen = new Set<string>();
  const rows = [...(tagged ?? []), ...(bySlug ?? [])].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  let deleted = 0;
  for (const row of rows ?? []) {
    if (!isStaleFacebookImportRow(row)) continue;
    if (row.slug) await hideExternalArticlesForArticleSlug(row.slug);
    const { error } = await admin.from("articles").delete().eq("id", row.id);
    if (!error) deleted += 1;
  }

  return { deleted };
}

/** Dépublie ou supprime les événements Facebook avec date recalée (ex. post 2022 → vendredi 2026). */
export async function purgeStaleFacebookEvents(): Promise<{
  unpublished: number;
  deleted: number;
}> {
  const admin = getAdminSupabase();
  if (!admin) return { unpublished: 0, deleted: 0 };

  const { data: rows } = await admin
    .from("events")
    .select("id, title, description, date, url, published, created_at")
    .ilike("url", "%facebook.com%");

  let unpublished = 0;
  let deleted = 0;

  for (const row of rows ?? []) {
    if (!isStaleFacebookEvent(row)) continue;

    if (row.published) {
      const { error } = await admin
        .from("events")
        .update({ published: false })
        .eq("id", row.id);
      if (!error) unpublished += 1;
      continue;
    }

    const { error } = await admin.from("events").delete().eq("id", row.id);
    if (!error) deleted += 1;
  }

  return { unpublished, deleted };
}

export async function countStaleFacebookEvents(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const { data: rows } = await admin
    .from("events")
    .select("id, title, description, date, url, published, created_at")
    .eq("published", true)
    .ilike("url", "%facebook.com%");

  return (rows ?? []).filter((row) => isStaleFacebookEvent(row)).length;
}

/** Nombre d’imports Facebook à nettoyer (admin). */
export async function countStaleFacebookImports(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const { data: tagged } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url")
    .filter("tags", "cs", "{facebook-import}");

  const { data: bySlug } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url")
    .ilike("slug", "%-fb-%");

  const seen = new Set<string>();
  let count = 0;
  for (const row of [...(tagged ?? []), ...(bySlug ?? [])]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    if (isStaleFacebookImportRow(row)) count += 1;
  }
  return count;
}

async function listFacebookImportArticles() {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const { data: tagged } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url, published")
    .filter("tags", "cs", "{facebook-import}");

  const { data: bySlug } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url, published")
    .ilike("slug", "%-fb-%");

  const seen = new Set<string>();
  return [...(tagged ?? []), ...(bySlug ?? [])].filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

/** Dépublie les coquilles Facebook sans texte ni affiche Supabase. */
export async function unpublishEmptyFacebookShells(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const rows = await listFacebookImportArticles();

  let unpublished = 0;
  for (const row of rows) {
    if (!row.published) continue;
    if (
      !isEmptyFacebookArticleShell({
        title: row.title,
        excerpt: row.excerpt,
        body: row.body,
        cover_url: row.cover_url,
      })
    ) {
      continue;
    }
    const { error } = await admin
      .from("articles")
      .update({ published: false, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!error) {
      if (row.slug) await hideExternalArticlesForArticleSlug(row.slug);
      unpublished += 1;
    }
  }
  return unpublished;
}

/** Supprime les coquilles Facebook publiées (titre auto « affiche · 26/06 », etc.). */
export async function deletePublishedEmptyFacebookShells(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const rows = await listFacebookImportArticles();
  let deleted = 0;

  for (const row of rows) {
    if (!row.published) continue;
    if (
      !isEmptyFacebookArticleShell({
        title: row.title,
        excerpt: row.excerpt,
        body: row.body,
        cover_url: row.cover_url,
      })
    ) {
      continue;
    }
    if (row.slug) await hideExternalArticlesForArticleSlug(row.slug);
    const { error } = await admin.from("articles").delete().eq("id", row.id);
    if (!error) deleted += 1;
  }

  return deleted;
}

/**
 * Hygiène imports Facebook — dépublie, supprime coquilles vides et doublons.
 * Appelé à chaque finish veille (pas seulement quand le cron Facebook tourne).
 */
export async function cleanupPublishedFacebookEmptyShells(): Promise<{
  unpublished: number;
  deleted: number;
  duplicatesRemoved: number;
}> {
  const emptyShellsDeleted = await deletePublishedEmptyFacebookShells();
  const { deleted: staleDeleted } = await purgeStaleFacebookImports();
  const { purgeDuplicateArticles } = await import(
    "@/lib/article-duplicate-cleanup"
  );
  const dupes = await purgeDuplicateArticles();
  return {
    unpublished: 0,
    deleted: emptyShellsDeleted + staleDeleted,
    duplicatesRemoved: dupes.deleted,
  };
}
