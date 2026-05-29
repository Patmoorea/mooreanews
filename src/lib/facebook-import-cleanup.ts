/**
 * Suppression des imports Facebook obsolètes ou vides (cron + admin).
 */

import { isStaleFacebookImportRow } from "@/lib/facebook-import-filters";
import { getAdminSupabase } from "@/lib/supabase/admin";

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
    .contains("tags", ["facebook-import"]);

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

/** Nombre d’imports Facebook à nettoyer (admin). */
export async function countStaleFacebookImports(): Promise<number> {
  const admin = getAdminSupabase();
  if (!admin) return 0;

  const { data: tagged } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url")
    .contains("tags", ["facebook-import"]);

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
