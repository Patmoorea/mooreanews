/**
 * Détection des imports Facebook obsolètes (2021–2022, etc.).
 */

import { contentReferencesStaleYear } from "@/lib/facebook-import-filters";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export function isStaleFacebookImport(row: {
  title: string;
  excerpt: string | null;
  body: string;
  slug: string;
}): boolean {
  const corpus = `${row.title} ${row.excerpt ?? ""} ${row.body}`;
  if (contentReferencesStaleYear(corpus)) return true;
  if (
    /\bpublication du 20\d{2}-\d{2}-\d{2}\b/i.test(row.title) &&
    contentReferencesStaleYear(row.title)
  ) {
    return true;
  }
  return /-fb-\d+-\d+$/.test(row.slug) && contentReferencesStaleYear(corpus);
}

/** Nombre d'articles facebook-import obsolètes encore en base. */
export async function countStaleFacebookImports(): Promise<number> {
  const admin = getAdminSupabase();
  const supabase = admin ?? (await getServerSupabase());
  if (!supabase) return 0;

  const { data } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, body")
    .contains("tags", ["facebook-import"]);

  return (data ?? []).filter(isStaleFacebookImport).length;
}
