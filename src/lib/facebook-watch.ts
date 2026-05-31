/**
 * Veille Facebook : Open Graph sur URLs configurées + Graph API (optionnel).
 */

import type { AggregationResult } from "@/lib/aggregator";
import { externalIdFromFacebookUrl, isFacebookUrl } from "@/lib/facebook-url";
import { fetchOpenGraph } from "@/lib/open-graph";
import { cleanImportedText } from "@/lib/html-entities";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";
import {
  isFacebookJunkText,
  shouldImportFacebookPost,
} from "@/lib/facebook-import-filters";
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
  attachments?: {
    data?: Array<{
      description?: string;
      title?: string;
      media_type?: string;
      media?: { image?: { src?: string } };
    }>;
  };
};

function normalizeGraphPost(raw: GraphPost): GraphPost {
  let message = cleanImportedText(raw.message?.trim() ?? "");
  let full_picture = raw.full_picture?.trim() ?? "";

  for (const att of raw.attachments?.data ?? []) {
    const attImage = att.media?.image?.src?.trim() ?? "";
    if (attImage && (!full_picture || attImage.length > full_picture.length)) {
      full_picture = attImage;
    }
    const extra = [att.title, att.description]
      .map((s) => cleanImportedText(s?.trim() ?? ""))
      .filter((s) => s.length > 0)
      .join("\n");
    if (extra && !message.includes(extra)) {
      message = message ? `${message}\n\n${extra}` : extra;
    }
  }

  return {
    id: raw.id,
    permalink_url: raw.permalink_url,
    created_time: raw.created_time,
    message: message || undefined,
    full_picture: full_picture || undefined,
  };
}

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
      const title = cleanImportedText(og?.title?.trim() || fallbackTitle);
      result.matched += 1;
      const row = {
        source_id: "facebook-watch",
        source_name: og?.title ? "Facebook — veille" : "Facebook — lien surveillé",
        external_id: externalIdFromFacebookUrl(url),
        url: og?.url || url,
        title,
        excerpt: og?.description ? cleanImportedText(og.description) : null,
        image_url: og?.imageUrl ?? null,
        published_at: new Date().toISOString(),
      };
      rows.push(row);
      if (
        og &&
        !isFacebookJunkText(title) &&
        !isFacebookJunkText(og.description ?? "")
      ) {
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

const GRAPH_POST_FIELDS_FULL =
  "id,message,permalink_url,created_time,full_picture,attachments{description,title,media_type,media{image{src}}}";
const GRAPH_POST_FIELDS_MINIMAL =
  "id,message,permalink_url,created_time,full_picture";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Erreurs Meta souvent temporaires (500, rate limit, subcode 99). */
function isTransientGraphError(status: number, body: string): boolean {
  if (status === 429 || status >= 500) return true;
  try {
    const json = JSON.parse(body) as {
      error?: { code?: number; error_subcode?: number; is_transient?: boolean };
    };
    const err = json.error;
    if (!err) return false;
    if (err.is_transient) return true;
    if (err.code === 1 && (err.error_subcode === 99 || err.error_subcode === 33)) {
      return true;
    }
    if (err.code === 2 || err.code === 4) return true;
  } catch {
    /* corps non JSON */
  }
  return false;
}

async function fetchGraphPagePostsOnce(
  graphPageId: string,
  token: string,
  fields: string,
): Promise<
  { ok: true; posts: GraphPost[] } | { ok: false; status: number; body: string }
> {
  const apiUrl = new URL(
    `https://graph.facebook.com/v21.0/${graphPageId}/posts`,
  );
  apiUrl.searchParams.set("fields", fields);
  apiUrl.searchParams.set("limit", "15");
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  const body = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body };
  }
  const json = JSON.parse(body) as { data?: GraphPost[] };
  return { ok: true, posts: json.data ?? [] };
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

  const fieldVariants = [GRAPH_POST_FIELDS_FULL, GRAPH_POST_FIELDS_MINIMAL];
  let lastFailure: { status: number; body: string } | null = null;

  for (const fields of fieldVariants) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await fetchGraphPagePostsOnce(graphPageId, token, fields);
      if (result.ok) {
        return result.posts.map(normalizeGraphPost);
      }
      lastFailure = { status: result.status, body: result.body };
      if (!isTransientGraphError(result.status, result.body)) {
        throw new Error(
          `Graph API ${page.name} (${graphPageId}): HTTP ${result.status} ${result.body.slice(0, 120)}`,
        );
      }
      if (attempt < 2) {
        await sleep(1500 * (attempt + 1));
      }
    }
  }

  throw new Error(
    `Graph API ${page.name} (${graphPageId}): HTTP ${lastFailure?.status ?? 0} ${(lastFailure?.body ?? "").slice(0, 120)}`,
  );
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
        const freshness = shouldImportFacebookPost(
          message,
          post.created_time,
          post,
        );
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
