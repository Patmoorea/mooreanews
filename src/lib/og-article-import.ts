/**
 * Importe une publication Facebook (Open Graph) en article MooreaNews :
 * titre, texte, affiche (og:image) — sans API Meta Graph.
 */

import { externalIdFromFacebookUrl } from "@/lib/facebook-url";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { FacebookArticleImportResult } from "@/lib/facebook-article-import";

export type OgFacebookItem = {
  url: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  sourceLabel: string;
};

function importEnabled(): boolean {
  return process.env.FACEBOOK_IMPORT_AS_ARTICLES === "true";
}

function publishedByDefault(): boolean {
  if (process.env.FACEBOOK_ARTICLES_PUBLISHED === "false") return false;
  return true;
}

function slugForOg(url: string): string {
  const id = externalIdFromFacebookUrl(url).replace(/[^a-zA-Z0-9-]/g, "-");
  return `fb-og-${id}`.slice(0, 100);
}

function hasPublishableContent(item: OgFacebookItem): boolean {
  const text = item.excerpt?.trim() ?? "";
  const img = item.imageUrl?.trim() ?? "";
  return img.length > 0 || text.length >= 20;
}

/** Crée des articles à partir des métadonnées OG (groupe, permalinks, photos FB). */
export async function importFacebookOgAsArticles(
  items: OgFacebookItem[],
): Promise<FacebookArticleImportResult> {
  const result: FacebookArticleImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
    createdArticles: [],
  };

  if (!importEnabled()) return result;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase non configuré — import OG impossible");
    return result;
  }

  const published = publishedByDefault();

  for (const item of items) {
    if (!hasPublishableContent(item)) continue;

    const slug = slugForOg(item.url);
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      result.skipped += 1;
      continue;
    }

    const title = item.title.trim().slice(0, 200) || item.sourceLabel;
    const excerpt =
      item.excerpt?.trim().slice(0, 280) ||
      `Publication repérée sur Facebook (${item.sourceLabel}).`;
    const bodyText = item.excerpt?.trim() ?? "";
    const footer = `\n\n---\n\nSource : [Facebook — ${item.sourceLabel}](${item.url})`;
    const body = bodyText ? `${bodyText}${footer}` : footer.trim();

    const { error } = await supabase.from("articles").insert({
      slug,
      title,
      excerpt,
      body,
      category: "actualites",
      tags: ["facebook-import", "facebook-og"],
      cover_url: item.imageUrl?.trim() || null,
      author: `${item.sourceLabel} (Facebook)`,
      featured: false,
      published,
    });

    if (error) {
      result.errors.push(`${slug}: ${error.message}`);
    } else {
      result.created += 1;
      result.createdArticles.push({ title, slug });
    }
  }

  return result;
}
