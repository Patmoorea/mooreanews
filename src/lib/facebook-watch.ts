/**
 * Veille Facebook : Open Graph sur URLs configurées + Graph API (optionnel).
 */

import type { AggregationResult } from "@/lib/aggregator";
import { externalIdFromFacebookUrl, isFacebookUrl } from "@/lib/facebook-url";
import { fetchOpenGraph } from "@/lib/open-graph";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";
import { shouldImportFacebookPost } from "@/lib/facebook-import-filters";
import { refreshFacebookUserTokenInProcess } from "@/lib/facebook-token";
import { importFacebookOgAsArticles } from "@/lib/og-article-import";
import {
  allFacebookWatchUrls,
  FACEBOOK_PAGE_WATCHES,
  FACEBOOK_WATCH_URLS,
  type FacebookPageWatch,
} from "@/lib/watch-sources";

function labelForFacebookUrl(url: string): string {
  return (
    FACEBOOK_WATCH_URLS.find((w) => w.url === url)?.label ??
    "Publication Facebook — Moorea"
  );
}

type GraphPost = {
  id: string;
  message?: string;
  permalink_url?: string;
  created_time?: string;
  full_picture?: string;
};

type MeAccountsPage = {
  id: string;
  name?: string;
  username?: string;
  access_token?: string;
};

async function upsertFacebookRows(
  rows: {
    source_id: string;
    source_name: string;
    external_id: string;
    url: string;
    title: string;
    excerpt: string | null;
    image_url: string | null;
    published_at: string;
  }[]
): Promise<number> {
  if (rows.length === 0) return 0;
  const supabase = getAdminSupabase();
  if (!supabase) return 0;

  const { error, count } = await supabase
    .from("external_articles")
    .upsert(rows, { onConflict: "source_id,external_id", count: "exact" });

  if (error) throw new Error(error.message);
  return count ?? rows.length;
}

/** Sonde les URLs Facebook listées dans watch-sources (+ env). */
export async function aggregateFacebookWatchUrls(): Promise<AggregationResult> {
  const result: AggregationResult = {
    source: "facebook-watch",
    fetched: 0,
    matched: 0,
    inserted: 0,
    errors: [],
  };

  const urls = allFacebookWatchUrls();
  result.fetched = urls.length;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
  }

  const rows: Parameters<typeof upsertFacebookRows>[0] = [];
  const ogForImport: Parameters<typeof importFacebookOgAsArticles>[0] = [];

  for (const url of urls) {
    if (!isFacebookUrl(url)) continue;
    const fallbackTitle = labelForFacebookUrl(url);
    try {
      const og = await fetchOpenGraph(url);
      const title = og?.title?.trim() || fallbackTitle;
      result.matched += 1;
      const row = {
        source_id: "facebook-watch",
        source_name: og?.title ? "Facebook — veille" : "Facebook — lien surveillé",
        external_id: externalIdFromFacebookUrl(url),
        url: og?.url || url,
        title,
        excerpt: og?.description || null,
        image_url: og?.imageUrl ?? null,
        published_at: new Date().toISOString(),
      };
      rows.push(row);
      if (og) {
        ogForImport.push({
          url: row.url,
          title,
          excerpt: og.description || null,
          imageUrl: og.imageUrl ?? null,
          sourceLabel: fallbackTitle,
        });
      }
    } catch (e) {
      result.errors.push(`${url}: ${String(e)}`);
      result.matched += 1;
      rows.push({
        source_id: "facebook-watch",
        source_name: "Facebook — lien surveillé",
        external_id: externalIdFromFacebookUrl(url),
        url,
        title: fallbackTitle,
        excerpt: null,
        image_url: null,
        published_at: new Date().toISOString(),
      });
    }
  }

  try {
    result.inserted = await upsertFacebookRows(rows);
  } catch (e) {
    result.errors.push(String(e));
  }

  const imported = await importFacebookOgAsArticles(ogForImport);
  result.articlesCreated = imported.created;
  result.eventsCreated = imported.eventsCreated;
  result.announcementsCreated = imported.announcementsCreated;
  result.articlesSkipped = imported.skipped;
  result.createdArticles = imported.createdArticles;
  result.createdEvents = imported.createdEvents;
  for (const err of imported.errors) {
    result.errors.push(err);
  }

  return result;
}

async function resolveGraphPageId(
  page: FacebookPageWatch,
  token: string
): Promise<string> {
  if (/^\d+$/.test(page.pageId)) return page.pageId;

  const meUrl = new URL("https://graph.facebook.com/v21.0/me");
  meUrl.searchParams.set("fields", "id,username");
  meUrl.searchParams.set("access_token", token);

  const meRes = await fetch(meUrl.toString(), { cache: "no-store" });
  if (!meRes.ok) return page.pageId;

  const me = (await meRes.json()) as { id?: string; username?: string };
  const username = me.username?.toLowerCase();
  const wanted = page.pageId.toLowerCase();
  if (me.id && (username === wanted || page.id === "moorea-news")) {
    return me.id;
  }
  return page.pageId;
}

async function fetchPagePosts(
  page: FacebookPageWatch,
  token: string
): Promise<GraphPost[]> {
  const graphPageId = /^\d+$/.test(page.pageId)
    ? page.pageId
    : page.id === "moorea-news"
      ? "me"
      : await resolveGraphPageId(page, token);
  const fields = "id,message,permalink_url,created_time,full_picture";
  const apiUrl = new URL(
    `https://graph.facebook.com/v21.0/${graphPageId}/posts`
  );
  apiUrl.searchParams.set("fields", fields);
  apiUrl.searchParams.set("limit", "15");
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Graph API ${page.name} (${graphPageId}): HTTP ${res.status} ${body.slice(0, 120)}`
    );
  }
  const json = (await res.json()) as { data?: GraphPost[] };
  return json.data ?? [];
}

async function fetchMeAccounts(userToken: string): Promise<MeAccountsPage[]> {
  const apiUrl = new URL(`https://graph.facebook.com/v21.0/me/accounts`);
  apiUrl.searchParams.set("fields", "id,name,username,access_token");
  apiUrl.searchParams.set("limit", "200");
  apiUrl.searchParams.set("access_token", userToken);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph API me/accounts: HTTP ${res.status} ${body.slice(0, 120)}`);
  }
  const json = (await res.json()) as { data?: MeAccountsPage[] };
  return json.data ?? [];
}

/** Permissions granulaires Meta : /me/accounts vide → jeton via ID ou username page. */
async function fetchPageAccessTokenViaUserToken(
  userToken: string,
  pageId: string,
): Promise<string | null> {
  const apiUrl = new URL(
    `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}`,
  );
  apiUrl.searchParams.set("fields", "access_token");
  apiUrl.searchParams.set("access_token", userToken);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token?.trim() ?? null;
}

function pickTokenForPage(options: {
  page: FacebookPageWatch;
  perPageTokenByIdOrUsername: Map<string, string>;
  fallbackPageToken?: string;
}): string | null {
  const key1 = options.page.pageId;
  const key2 = options.page.pageId.toLowerCase();
  return (
    options.perPageTokenByIdOrUsername.get(key1) ??
    options.perPageTokenByIdOrUsername.get(key2) ??
    options.fallbackPageToken ??
    null
  );
}

/** Derniers posts des pages configurées (jeton page ou jeton user → /me/accounts). */
export async function aggregateFacebookPagesGraph(): Promise<AggregationResult> {
  const result: AggregationResult = {
    source: "facebook-pages",
    fetched: 0,
    matched: 0,
    inserted: 0,
    errors: [],
  };

  let fallbackPageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  let userToken = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim();
  if (!fallbackPageToken && !userToken) return result;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
  }

  if (userToken) {
    const refreshed = await refreshFacebookUserTokenInProcess();
    if (refreshed.token) userToken = refreshed.token;
    if (refreshed.refreshed) {
      result.errors.push(
        "Jeton utilisateur Facebook renouvelé pour ce cron (mettez à jour FACEBOOK_USER_ACCESS_TOKEN sur Vercel)",
      );
    }
  }

  const perPageTokenByIdOrUsername = new Map<string, string>();
  if (userToken) {
    try {
      const pages = await fetchMeAccounts(userToken);
      for (const p of pages) {
        const t = p.access_token?.trim();
        if (!t) continue;
        if (p.id) perPageTokenByIdOrUsername.set(p.id, t);
        if (p.username) {
          perPageTokenByIdOrUsername.set(p.username, t);
          perPageTokenByIdOrUsername.set(p.username.toLowerCase(), t);
        }
      }
    } catch (e) {
      result.errors.push(String(e));
    }
  }

  const rows: Parameters<typeof upsertFacebookRows>[0] = [];
  const articleImports: {
    posts: Parameters<typeof importFacebookPostsAsContent>[0];
    config: Parameters<typeof importFacebookPostsAsContent>[1];
  }[] = [];

  for (const page of FACEBOOK_PAGE_WATCHES) {
    try {
      if (userToken && !perPageTokenByIdOrUsername.has(page.pageId)) {
        const viaUser = await fetchPageAccessTokenViaUserToken(
          userToken,
          page.pageId,
        );
        if (viaUser) {
          perPageTokenByIdOrUsername.set(page.pageId, viaUser);
          if (!/^\d+$/.test(page.pageId)) {
            perPageTokenByIdOrUsername.set(page.pageId.toLowerCase(), viaUser);
          }
        }
      }

      const tokenForPage = pickTokenForPage({
        page,
        perPageTokenByIdOrUsername,
        fallbackPageToken:
          perPageTokenByIdOrUsername.size > 0 ? undefined : fallbackPageToken,
      });
      if (!tokenForPage) {
        if (!page.optional) {
          result.errors.push(`Token manquant pour ${page.pageId}`);
        }
        continue;
      }
      const posts = await fetchPagePosts(page, tokenForPage);
      result.fetched += posts.length;
      if (page.id === "moorea-news" || page.id === "commune-moorea") {
        articleImports.push({
          posts,
          config: {
            pageKey: page.id === "moorea-news" ? "mooreanews" : "commune",
            pageName: page.name,
            homepage: page.homepage,
            authorLabel: `${page.name} (Facebook)`,
            tag:
              page.id === "moorea-news" ? "moorea-news-fb" : "commune-moorea",
          },
        });
      }
      for (const post of posts) {
        const message = post.message?.trim() ?? "";
        const freshness = shouldImportFacebookPost(message, post.created_time);
        if (!freshness.ok) continue;

        const title =
          message.split("\n")[0]?.trim().slice(0, 200) ||
          `${page.name} — publication`;
        const link = post.permalink_url ?? `${page.homepage}/posts/${post.id}`;
        rows.push({
          source_id: `facebook-page-${page.id}`,
          source_name: page.name,
          external_id: `fb-graph-${post.id}`,
          url: link,
          title,
          excerpt: message.slice(0, 400) || null,
          image_url: post.full_picture ?? null,
          published_at: freshness.publishedAt,
        });
        result.matched += 1;
      }
    } catch (e) {
      result.errors.push(String(e));
    }
  }

  try {
    result.inserted = await upsertFacebookRows(rows);
  } catch (e) {
    result.errors.push(String(e));
  }

  for (const batch of articleImports) {
    const imported = await importFacebookPostsAsContent(
      batch.posts,
      batch.config,
    );
    result.articlesCreated =
      (result.articlesCreated ?? 0) + imported.articlesCreated;
    result.eventsCreated =
      (result.eventsCreated ?? 0) + imported.eventsCreated;
    result.announcementsCreated =
      (result.announcementsCreated ?? 0) + imported.announcementsCreated;
    result.articlesSkipped =
      (result.articlesSkipped ?? 0) + imported.skipped;
    if (imported.createdArticles.length > 0) {
      result.createdArticles = [
        ...(result.createdArticles ?? []),
        ...imported.createdArticles,
      ];
    }
    if (imported.createdEvents.length > 0) {
      result.createdEvents = [
        ...(result.createdEvents ?? []),
        ...imported.createdEvents,
      ];
    }
    for (const err of imported.errors) {
      result.errors.push(err);
    }
  }

  return result;
}

export async function aggregateWebWatch(): Promise<AggregationResult[]> {
  const { aggregateWebPagesWatch } = await import("@/lib/web-watch");
  return Promise.all([
    aggregateFacebookWatchUrls(),
    aggregateFacebookPagesGraph(),
    aggregateWebPagesWatch(),
  ]);
}
