/**
 * Masque les entrées external_articles liées à un article importé Facebook.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

/** Ex. mooreanews-fb-350029589935-10161825881514937 → fb-graph-350029589935_10161825881514937 */
export function graphExternalIdFromArticleSlug(slug: string): string | null {
  const m = slug.match(/-fb-(\d+)-(\d+)$/);
  if (!m) return null;
  return `fb-graph-${m[1]}_${m[2]}`;
}

export async function hideExternalArticlesForArticleSlug(
  slug: string,
): Promise<void> {
  const externalId = graphExternalIdFromArticleSlug(slug);
  if (!externalId) return;

  const supabase = getAdminSupabase();
  if (!supabase) return;

  await supabase
    .from("external_articles")
    .update({ hidden: true })
    .eq("external_id", externalId);
}
