/**
 * Importe les posts Facebook en articles MooreaNews (Graph API + jeton page).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

export type FacebookPostForImport = {
  id: string;
  message?: string;
  permalink_url?: string;
  created_time?: string;
  full_picture?: string;
};

export type FacebookArticleImportResult = {
  created: number;
  skipped: number;
  errors: string[];
};

export type FacebookPageImportConfig = {
  pageKey: string;
  pageName: string;
  homepage: string;
  authorLabel: string;
  tag: string;
};

function facebookImportEnabled(): boolean {
  return process.env.FACEBOOK_IMPORT_AS_ARTICLES === "true";
}

function articlesPublishedByDefault(): boolean {
  if (process.env.FACEBOOK_ARTICLES_PUBLISHED === "false") return false;
  return true;
}

function slugForPost(pageKey: string, postId: string): string {
  const safe = postId.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 80);
  return `${pageKey}-fb-${safe}`;
}

function buildBody(
  message: string,
  permalink: string,
  pageName: string,
): string {
  const text = message.trim();
  const footer = `\n\n---\n\nSource : [Publication Facebook — ${pageName}](${permalink})`;
  return text ? `${text}${footer}` : `Publication Facebook — ${pageName}.${footer}`;
}

/** Crée des articles Supabase pour les posts d’une page (sans doublon). */
export async function importFacebookPagePostsAsArticles(
  posts: FacebookPostForImport[],
  config: FacebookPageImportConfig,
): Promise<FacebookArticleImportResult> {
  const result: FacebookArticleImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
  };

  if (!facebookImportEnabled()) return result;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase non configuré — import articles impossible");
    return result;
  }

  const published = articlesPublishedByDefault();

  for (const post of posts) {
    const permalink =
      post.permalink_url ??
      `${config.homepage.replace(/\/$/, "")}/posts/${post.id}`;
    const message = post.message?.trim() ?? "";
    const slug = slugForPost(config.pageKey, post.id);

    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      result.skipped += 1;
      continue;
    }

    const title =
      message.split("\n")[0]?.trim().slice(0, 200) ||
      `${config.pageName} — publication du ${post.created_time?.slice(0, 10) ?? "récente"}`;

    const excerpt =
      message.slice(0, 280) ||
      `Publication repérée sur la page Facebook ${config.pageName}.`;

    const { error } = await supabase.from("articles").insert({
      slug,
      title,
      excerpt,
      body: buildBody(message, permalink, config.pageName),
      category: "actualites",
      tags: ["facebook-import", config.tag],
      cover_url: post.full_picture?.trim() || null,
      author: config.authorLabel,
      featured: false,
      published,
    });

    if (error) {
      result.errors.push(`${slug}: ${error.message}`);
    } else {
      result.created += 1;
    }
  }

  return result;
}

/** @deprecated Utiliser importFacebookPagePostsAsArticles */
export const importCommuneFacebookPostsAsArticles = (
  posts: FacebookPostForImport[],
  pageName: string,
) =>
  importFacebookPagePostsAsArticles(posts, {
    pageKey: "commune",
    pageName,
    homepage: "https://www.facebook.com/CommuneMooreaMaiao",
    authorLabel: "Commune de Moorea-Maiao (Facebook)",
    tag: "commune-moorea",
  });
