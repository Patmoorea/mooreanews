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

  const { data: rows } = await admin
    .from("articles")
    .select("id, slug, title, excerpt, body, tags, published_at, cover_url")
    .contains("tags", ["facebook-import"]);

  let deleted = 0;
  for (const row of rows ?? []) {
    if (!isStaleFacebookImportRow(row)) continue;
    if (row.slug) await hideExternalArticlesForArticleSlug(row.slug);
    const { error } = await admin.from("articles").delete().eq("id", row.id);
    if (!error) deleted += 1;
  }

  return { deleted };
}
