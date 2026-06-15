/**
 * Slugs d’articles auto-importés supprimés par l’admin — la veille ne les recrée pas.
 */

import { createHash } from "crypto";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { hideExternalArticlesForArticleSlug } from "@/lib/facebook-external-sync";
import { isFacebookImportArticle } from "@/lib/facebook-import-filters";

function normalizeKey(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Clé blocklist pour une alerte veille (URL source RSS / Facebook). */
export function alertBlocklistSlug(sourceUrl: string): string {
  const hash = createHash("sha256").update(sourceUrl.trim()).digest("hex").slice(0, 24);
  return `alert-src:${hash}`;
}

/** Clé blocklist pour une alerte sans URL stable (titre normalisé). */
export function alertTitleBlocklistSlug(title: string): string {
  const key = normalizeKey(title).slice(0, 120);
  const hash = createHash("sha256").update(key).digest("hex").slice(0, 24);
  return `alert-title:${hash}`;
}

export async function isAlertImportBlocked(input: {
  sourceUrl?: string | null;
  title?: string | null;
}): Promise<boolean> {
  const admin = getAdminSupabase();
  if (!admin) return false;

  const slugs: string[] = [];
  const url = input.sourceUrl?.trim();
  if (url) slugs.push(alertBlocklistSlug(url));
  const title = input.title?.trim();
  if (title) slugs.push(alertTitleBlocklistSlug(title));
  if (!slugs.length) return false;

  const { data } = await admin
    .from("import_blocklist")
    .select("slug")
    .in("slug", slugs)
    .limit(1);
  return Boolean(data?.length);
}

export async function blockAlertOnAdminDelete(row: {
  title: string;
  source_url?: string | null;
}): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) return;

  const title = row.title?.trim();
  const sourceUrl = row.source_url?.trim();

  if (sourceUrl) {
    await blockImportedArticleSlug({
      slug: alertBlocklistSlug(sourceUrl),
      title,
      sourceId: "alert",
      externalId: sourceUrl,
    });
  }
  if (title) {
    await blockImportedArticleSlug({
      slug: alertTitleBlocklistSlug(title),
      title,
      sourceId: "alert",
    });
  }
}

export function isAutoImportedArticle(slug: string, tags?: string[] | null): boolean {
  const t = tags ?? [];
  if (t.includes("rss-import") || t.includes("facebook-import")) return true;
  if (t.includes("ai-draft") || t.includes("veille-ia")) return true;
  if (slug.startsWith("rss-") || slug.includes("-fb-") || slug.startsWith("ia-")) {
    return true;
  }
  return isFacebookImportArticle({ slug, tags: t });
}

export async function isSlugImportBlocked(slug: string): Promise<boolean> {
  const admin = getAdminSupabase();
  if (!admin || !slug.trim()) return false;
  const { data } = await admin
    .from("import_blocklist")
    .select("slug")
    .eq("slug", slug.trim())
    .maybeSingle();
  return Boolean(data?.slug);
}

export async function blockImportedArticleSlug(input: {
  slug: string;
  title?: string;
  sourceId?: string | null;
  externalId?: string | null;
}): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin || !input.slug.trim()) return;

  await admin.from("import_blocklist").upsert(
    {
      slug: input.slug.trim(),
      source_id: input.sourceId?.trim() || null,
      external_id: input.externalId?.trim() || null,
      title: input.title?.trim().slice(0, 200) || null,
      blocked_at: new Date().toISOString(),
    },
    { onConflict: "slug" },
  );

  if (input.slug.includes("-fb-")) {
    await hideExternalArticlesForArticleSlug(input.slug);
  }

  if (input.sourceId && input.externalId) {
    await admin
      .from("external_articles")
      .update({ hidden: true })
      .eq("source_id", input.sourceId)
      .eq("external_id", input.externalId);
  }
}

function rssSourceIdFromSlug(slug: string): string | null {
  if (!slug.startsWith("rss-")) return null;
  const rest = slug.slice(4);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash <= 0) return null;
  return rest.slice(0, lastDash);
}

/** À appeler quand l’admin supprime un article auto-importé. */
export async function blockArticleOnAdminDelete(row: {
  slug: string;
  title: string;
  tags?: string[] | null;
}): Promise<void> {
  if (!isAutoImportedArticle(row.slug, row.tags)) return;

  await blockImportedArticleSlug({
    slug: row.slug,
    title: row.title,
    sourceId:
      row.tags?.find(
        (t) =>
          t !== "rss-import" &&
          t !== "facebook-import" &&
          !t.startsWith("ai-") &&
          t !== "veille-ia",
      ) ?? rssSourceIdFromSlug(row.slug),
  });
}
