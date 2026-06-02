/**
 * Importe une publication Facebook (Open Graph) → événement / annonce / actualité.
 */

import { externalIdFromFacebookUrl } from "@/lib/facebook-url";
import type { FacebookArticleImportResult } from "@/lib/facebook-article-import";
import { isFacebookJunkText } from "@/lib/facebook-import-filters";
import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";
import { cleanImportedText } from "@/lib/html-entities";

export type OgFacebookItem = {
  url: string;
  title: string;
  excerpt: string | null;
  imageUrl: string | null;
  sourceLabel: string;
};

function hasPublishableContent(item: OgFacebookItem): boolean {
  const title = cleanImportedText(item.title);
  const excerpt = cleanImportedText(item.excerpt ?? "");
  if (isFacebookJunkText(title) || isFacebookJunkText(excerpt)) return false;
  const text = excerpt || title;
  const img = item.imageUrl?.trim() ?? "";
  if (isFacebookJunkText(text)) return false;
  if (text.length >= 40) return true;
  if (text.length >= 15 && img.length > 0) return true;
  if (img.length > 0 && !isFacebookJunkText(title)) return true;
  return false;
}

function pageKeyFromLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "fb-og";
}

/** Crée événement / annonce / article à partir des métadonnées OG (affiche incluse). */
export async function importFacebookOgAsArticles(
  items: OgFacebookItem[],
): Promise<
  FacebookArticleImportResult & {
    eventsCreated: number;
    announcementsCreated: number;
    alertsCreated: number;
    createdEvents: { title: string; id: string; date: string }[];
    createdAlerts: string[];
  }
> {
  const result = {
    created: 0,
    skipped: 0,
    errors: [] as string[],
    createdArticles: [] as { title: string; slug: string }[],
    eventsCreated: 0,
    announcementsCreated: 0,
    alertsCreated: 0,
    createdEvents: [] as { title: string; id: string; date: string }[],
    createdAlerts: [] as string[],
  };

  for (const item of items) {
    if (!hasPublishableContent(item)) continue;

    const message = cleanImportedText(
      item.excerpt?.trim() || item.title.trim(),
    );
    const label = item.sourceLabel.trim() || "Facebook";

    const imported = await importFacebookPostsAsContent(
      [
        {
          id: externalIdFromFacebookUrl(item.url),
          message,
          permalink_url: item.url,
          full_picture: item.imageUrl?.trim() || undefined,
          created_time: new Date().toISOString(),
        },
      ],
      {
        pageKey: pageKeyFromLabel(label),
        pageName: label,
        homepage: "https://www.facebook.com",
        authorLabel: `${label} (Facebook)`,
        tag: "facebook-og",
        allowFerryAlerts: false,
      },
    );

    result.created += imported.articlesCreated;
    result.skipped += imported.skipped + imported.skippedStale;
    result.eventsCreated += imported.eventsCreated;
    result.announcementsCreated += imported.announcementsCreated;
    result.alertsCreated += imported.alertsCreated;
    result.createdAlerts.push(...imported.createdAlerts);
    result.createdArticles.push(...imported.createdArticles);
    result.createdEvents.push(...imported.createdEvents);
    result.errors.push(...imported.errors);
  }

  return result;
}
