/**
 * Importe une publication Facebook (Open Graph) → événement / annonce / actualité.
 */

import { externalIdFromFacebookUrl } from "@/lib/facebook-url";
import type { FacebookArticleImportResult } from "@/lib/facebook-article-import";
import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";

export type OgFacebookItem = {
  url: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  sourceLabel: string;
};

function hasPublishableContent(item: OgFacebookItem): boolean {
  const text = item.excerpt?.trim() ?? item.title.trim();
  const img = item.imageUrl?.trim() ?? "";
  return img.length > 0 || text.length >= 10;
}

/** Crée événement / annonce / article à partir des métadonnées OG. */
export async function importFacebookOgAsArticles(
  items: OgFacebookItem[],
): Promise<
  FacebookArticleImportResult & {
    eventsCreated: number;
    announcementsCreated: number;
    createdEvents: { title: string; id: string; date: string }[];
  }
> {
  const empty = {
    created: 0,
    skipped: 0,
    errors: [] as string[],
    createdArticles: [] as { title: string; slug: string }[],
    eventsCreated: 0,
    announcementsCreated: 0,
    createdEvents: [] as { title: string; id: string; date: string }[],
  };

  const posts = items
    .filter(hasPublishableContent)
    .map((item) => ({
      id: externalIdFromFacebookUrl(item.url),
      message: item.excerpt?.trim() || item.title.trim(),
      permalink_url: item.url,
      full_picture: item.imageUrl ?? undefined,
    }));

  if (posts.length === 0) return empty;

  const imported = await importFacebookPostsAsContent(posts, {
    pageKey: "fb-og",
    pageName: items[0]?.sourceLabel ?? "Facebook",
    homepage: "https://www.facebook.com",
    authorLabel: `${items[0]?.sourceLabel ?? "Facebook"} (veille)`,
    tag: "facebook-og",
  });

  return {
    created: imported.articlesCreated,
    skipped: imported.skipped,
    errors: imported.errors,
    createdArticles: imported.createdArticles,
    eventsCreated: imported.eventsCreated,
    announcementsCreated: imported.announcementsCreated,
    createdEvents: imported.createdEvents,
  };
}
