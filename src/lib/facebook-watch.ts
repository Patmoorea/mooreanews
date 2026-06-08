/**
 * Veille Facebook : Open Graph sur URLs configurées + Graph API (optionnel).
 */

import type { AggregationResult } from "@/lib/aggregator";
import { externalIdFromFacebookUrl, isFacebookUrl } from "@/lib/facebook-url";
import { fetchOpenGraph } from "@/lib/open-graph";
import { upsertExternalArticleRows } from "@/lib/external-articles-upsert";
import { cleanImportedText } from "@/lib/html-entities";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";
import {
  facebookCronRecentPostLimit,
  isFacebookJunkText,
  shouldImportFacebookPost,
} from "@/lib/facebook-import-filters";
import {
  GRAPH_POST_DETAIL_FIELDS,
  normalizeGraphPostRaw,
  type GraphPostRaw,
} from "@/lib/facebook-post-enrich";
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

type GraphPost = GraphPostRaw;

function normalizeGraphPost(raw: GraphPost): GraphPost {
  return normalizeGraphPostRaw(raw) as GraphPost;
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
  }[],
): Promise<{ inserted: number; errors: string[] }> {
  return upsertExternalArticleRows(rows);
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

  const upserted = await upsertFacebookRows(rows);
  result.inserted = upserted.inserted;
  result.errors.push(...upserted.errors);

  const imported = await importFacebookOgAsArticles(ogForImport);
  result.articlesCreated = imported.created;
  result.eventsCreated = imported.eventsCreated;
  result.announcementsCreated = imported.announcementsCreated;
  result.alertsCreated = imported.alertsCreated;
  result.createdAlerts = imported.createdAlerts;
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

const GRAPH_POST_FIELDS_FULL = GRAPH_POST_DETAIL_FIELDS;
const GRAPH_POST_FIELDS_MINIMAL =
  "id,message,permalink_url,created_time,full_picture,picture";

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
  limit: number,
  after?: string,
  edge: "posts" | "published_posts" | "feed" = "posts",
): Promise<
  | { ok: true; posts: GraphPost[]; next?: string }
  | { ok: false; status: number; body: string }
> {
  const apiUrl = new URL(
    `https://graph.facebook.com/v21.0/${graphPageId}/${edge}`,
  );
  apiUrl.searchParams.set("fields", fields);
  apiUrl.searchParams.set("limit", String(limit));
  if (after) apiUrl.searchParams.set("after", after);
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  const body = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body };
  }
  const json = JSON.parse(body) as {
    data?: GraphPost[];
    paging?: { cursors?: { after?: string } };
  };
  return {
    ok: true,
    posts: json.data ?? [],
    next: json.paging?.cursors?.after,
  };
}

type GraphUploadedPhoto = {
  id: string;
  created_time?: string;
  link?: string;
  name?: string;
  alt_text?: string;
  images?: { source?: string; width?: number; height?: number }[];
};

function numericIdsFromGraphPosts(posts: Iterable<GraphPost>): Set<string> {
  const ids = new Set<string>();
  for (const post of posts) {
    const tail = post.id.split("_").pop();
    if (tail) ids.add(tail);
    const fbid = post.permalink_url?.match(/fbid=(\d+)/i)?.[1];
    if (fbid) ids.add(fbid);
    const postsId = post.permalink_url?.match(/\/posts\/(\d+)/i)?.[1];
    if (postsId) ids.add(postsId);
  }
  return ids;
}

function graphUploadedPhotoToPost(
  photo: GraphUploadedPhoto,
  graphPageId: string,
): GraphPost {
  const bestImage = [...(photo.images ?? [])].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0),
  )[0]?.source?.trim();
  const caption = photo.name?.trim() || photo.alt_text?.trim() || "";
  return {
    id: `${graphPageId}_${photo.id}`,
    created_time: photo.created_time,
    permalink_url: photo.link,
    message: caption || undefined,
    full_picture: bestImage || undefined,
  };
}

/** Photos uploadées sur la page (album) — absentes parfois de /posts. */
async function fetchPageUploadedPhotos(
  graphPageId: string,
  token: string,
  limitPerPage = 50,
  maxPages = 4,
): Promise<GraphPost[]> {
  const out: GraphPost[] = [];
  let after: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const apiUrl = new URL(
      `https://graph.facebook.com/v21.0/${graphPageId}/photos`,
    );
    apiUrl.searchParams.set("type", "uploaded");
    apiUrl.searchParams.set(
      "fields",
      "id,created_time,link,images,name,alt_text",
    );
    apiUrl.searchParams.set("limit", String(limitPerPage));
    if (after) apiUrl.searchParams.set("after", after);
    apiUrl.searchParams.set("access_token", token);

    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    if (!res.ok) break;
    const json = (await res.json()) as {
      data?: GraphUploadedPhoto[];
      paging?: { cursors?: { after?: string } };
    };
    for (const photo of json.data ?? []) {
      out.push(graphUploadedPhotoToPost(photo, graphPageId));
    }
    after = json.paging?.cursors?.after;
    if (!after || (json.data?.length ?? 0) === 0) break;
  }

  return out;
}

async function fetchPagePosts(
  page: FacebookPageWatch,
  token: string,
  options?: { light?: boolean },
): Promise<GraphPost[]> {
  const light = options?.light === true;
  const graphPageId = /^\d+$/.test(page.pageId)
    ? page.pageId
    : page.id === "moorea-news"
      ? "350029589936"
      : await resolveGraphPageId(page, token);

  const fieldVariants = [GRAPH_POST_FIELDS_FULL, GRAPH_POST_FIELDS_MINIMAL];
  const pageLimit =
    page.id === "moorea-news" ? (light ? 25 : 50) : 15;
  const maxPages = page.id === "moorea-news" ? (light ? 1 : 5) : 1;
  const edges: Array<"posts" | "published_posts" | "feed"> =
    page.id === "moorea-news"
      ? light
        ? ["posts", "published_posts"]
        : ["posts", "published_posts", "feed"]
      : ["posts"];
  const maxPagesPublished = page.id === "moorea-news" ? (light ? 1 : 2) : 0;
  const maxPagesFeed = page.id === "moorea-news" && !light ? 2 : 0;
  let lastFailure: { status: number; body: string } | null = null;
  const byId = new Map<string, GraphPost>();

  for (const edge of edges) {
    for (const fields of fieldVariants) {
      let after: string | undefined;
      const pagesForEdge =
        edge === "published_posts"
          ? maxPagesPublished
          : edge === "feed"
            ? maxPagesFeed
            : maxPages;
      for (let pageNum = 0; pageNum < pagesForEdge; pageNum++) {
        let pageOk = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          const result = await fetchGraphPagePostsOnce(
            graphPageId,
            token,
            fields,
            pageLimit,
            after,
            edge,
          );
          if (result.ok) {
            for (const p of result.posts) {
              const norm = normalizeGraphPost(p);
              const prev = byId.get(norm.id);
              if (
                !prev ||
                (norm.full_picture && !prev.full_picture) ||
                ((norm.message?.length ?? 0) > (prev.message?.length ?? 0))
              ) {
                byId.set(norm.id, norm);
              }
            }
            after = result.next;
            pageOk = true;
            break;
          }
          lastFailure = { status: result.status, body: result.body };
          if (!isTransientGraphError(result.status, result.body)) {
            if (edge === "published_posts") break;
            throw new Error(
              `Graph API ${page.name} (${graphPageId}/${edge}): HTTP ${result.status} ${result.body.slice(0, 120)}`,
            );
          }
          if (attempt < 2) {
            await sleep(1500 * (attempt + 1));
          }
        }
        if (!pageOk || !after) break;
      }
      if (byId.size > 0 && fields === GRAPH_POST_FIELDS_FULL) break;
    }
  }

  if (page.id === "moorea-news") {
    try {
      const knownIds = numericIdsFromGraphPosts(byId.values());
      const photos = await fetchPageUploadedPhotos(
        graphPageId,
        token,
        light ? 25 : 50,
        light ? 1 : 4,
      );
      for (const photo of photos) {
        const photoNumeric = photo.id.split("_").pop() ?? photo.id;
        if (knownIds.has(photoNumeric)) continue;
        const norm = normalizeGraphPost(photo);
        byId.set(norm.id, norm);
        knownIds.add(photoNumeric);
      }
    } catch {
      /* photos optionnel si Meta refuse l’edge */
    }
  }

  if (byId.size > 0) {
    return [...byId.values()].sort((a, b) => {
      const ta = Date.parse(a.created_time ?? "") || 0;
      const tb = Date.parse(b.created_time ?? "") || 0;
      return tb - ta;
    });
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
export async function aggregateFacebookPagesGraph(options?: {
  /** Cron Vercel : lit moins de pages Graph + importe seulement les N posts récents. */
  light?: boolean;
  recentImportLimit?: number;
}): Promise<AggregationResult> {
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

  const teItoRauGraphNoise = (msg: string) =>
    msg.includes("Te Ito Rau") ||
    msg.includes("100088637945937") ||
    /unsupported get request/i.test(msg);

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

      let tokenForPage = pickTokenForPage({
        page,
        perPageTokenByIdOrUsername,
        fallbackPageToken:
          perPageTokenByIdOrUsername.size > 0
            ? undefined
            : fallbackPageToken,
      });
      if (!tokenForPage) {
        if (!page.optional) {
          result.errors.push(`Token manquant pour ${page.pageId}`);
        }
        continue;
      }
      const posts = await fetchPagePosts(page, tokenForPage, {
        light: options?.light,
      });
      result.fetched += posts.length;
      if (
        page.id === "moorea-news" ||
        page.id === "commune-moorea"
      ) {
        const isMooreaNews = page.id === "moorea-news";
        const importPosts =
          isMooreaNews && options?.recentImportLimit
            ? posts.slice(0, options.recentImportLimit)
            : posts;
        result.importProcessed = importPosts.length;
        articleImports.push({
          posts: importPosts,
          config: {
            pageKey: isMooreaNews ? "mooreanews" : "commune",
            pageName: page.name,
            homepage: page.homepage,
            authorLabel: `${page.name} (Facebook)`,
            tag: isMooreaNews ? "moorea-news-fb" : "commune-moorea",
            allowFerryAlerts: isMooreaNews,
            importAllFeedPosts: isMooreaNews,
            pageAccessToken: tokenForPage,
            graphPageId: isMooreaNews ? "350029589936" : page.pageId,
            cronLight: options?.light === true,
          },
        });
      }
      for (const post of posts) {
        const message = cleanImportedText(post.message?.trim() ?? "");
        const freshness = shouldImportFacebookPost(
          message,
          post.created_time,
          post,
          page.id === "moorea-news"
            ? { importAllFeedPosts: true }
            : undefined,
        );
        if (!freshness.ok) continue;

        if (page.id === "moorea-news") continue;

        const firstLine = message.split("\n")[0]?.trim().slice(0, 200) ?? "";
        const title =
          firstLine && !isFacebookJunkText(firstLine)
            ? firstLine
            : `${page.name} — publication`;
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
      const msg = String(e);
      if (!teItoRauGraphNoise(msg)) {
        result.errors.push(msg);
      }
    }
  }

  const upserted = await upsertFacebookRows(rows);
  result.inserted = upserted.inserted;
  result.errors.push(...upserted.errors);

  for (const batch of articleImports) {
    const imported = await importFacebookPostsAsContent(
      batch.posts,
      batch.config,
    );
    result.articlesCreated =
      (result.articlesCreated ?? 0) + imported.articlesCreated;
    result.articlesRepaired =
      (result.articlesRepaired ?? 0) + (imported.articlesRepaired ?? 0);
    result.eventsCreated =
      (result.eventsCreated ?? 0) + imported.eventsCreated;
    result.announcementsCreated =
      (result.announcementsCreated ?? 0) + imported.announcementsCreated;
    result.alertsCreated =
      (result.alertsCreated ?? 0) + imported.alertsCreated;
    result.articlesSkipped =
      (result.articlesSkipped ?? 0) + imported.skipped;
    if (imported.createdAlerts.length > 0) {
      result.createdAlerts = [
        ...(result.createdAlerts ?? []),
        ...imported.createdAlerts,
      ];
    }
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
      if (!teItoRauGraphNoise(err)) {
        result.errors.push(err);
      }
    }
    if (imported.warnings?.length) {
      result.warnings = [...(result.warnings ?? []), ...imported.warnings];
    }
    result.coversPersisted =
      (result.coversPersisted ?? 0) + (imported.coversPersisted ?? 0);
    result.coversFailed =
      (result.coversFailed ?? 0) + (imported.coversFailed ?? 0);
  }

  result.errors = result.errors.filter((e) => !teItoRauGraphNoise(e));

  return result;
}

/** Diagnostic admin : derniers posts Graph API page MooreaNews. */
export async function listMooreaNewsGraphPosts(): Promise<
  Array<{
    id: string;
    created_time?: string;
    message?: string;
    permalink_url?: string;
    full_picture?: string;
  }>
> {
  let fallbackPageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  let userToken = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim();
  if (!fallbackPageToken && !userToken) return [];

  const page = FACEBOOK_PAGE_WATCHES.find((p) => p.id === "moorea-news");
  if (!page) return [];

  const perPageTokenByIdOrUsername = new Map<string, string>();
  if (userToken) {
    const refreshed = await refreshFacebookUserTokenInProcess();
    if (refreshed.token) userToken = refreshed.token;
    try {
      for (const acc of await fetchMeAccounts(userToken)) {
        if (acc.access_token && acc.id) {
          perPageTokenByIdOrUsername.set(acc.id, acc.access_token);
        }
        if (acc.access_token && acc.username) {
          perPageTokenByIdOrUsername.set(acc.username.toLowerCase(), acc.access_token);
        }
      }
    } catch {
      /* me/accounts optionnel */
    }
  }

  const token = pickTokenForPage({
    page,
    perPageTokenByIdOrUsername,
    fallbackPageToken:
      perPageTokenByIdOrUsername.size > 0 ? undefined : fallbackPageToken,
  });
  if (!token) return [];

  return fetchPagePosts(page, token, { light: true });
}

/** Derniers posts Facebook Commune de Moorea-Maiao (garde, actualités). */
export async function listCommuneMooreaGraphPosts(): Promise<
  Array<{
    id: string;
    created_time?: string;
    message?: string;
    permalink_url?: string;
    full_picture?: string;
  }>
> {
  let fallbackPageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  let userToken = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim();
  if (!fallbackPageToken && !userToken) return [];

  const page = FACEBOOK_PAGE_WATCHES.find((p) => p.id === "commune-moorea");
  if (!page) return [];

  const perPageTokenByIdOrUsername = new Map<string, string>();
  if (userToken) {
    const refreshed = await refreshFacebookUserTokenInProcess();
    if (refreshed.token) userToken = refreshed.token;
    try {
      for (const acc of await fetchMeAccounts(userToken)) {
        if (acc.access_token && acc.id) {
          perPageTokenByIdOrUsername.set(acc.id, acc.access_token);
        }
        if (acc.access_token && acc.username) {
          perPageTokenByIdOrUsername.set(acc.username.toLowerCase(), acc.access_token);
        }
      }
    } catch {
      /* me/accounts optionnel */
    }
  }

  const token = pickTokenForPage({
    page,
    perPageTokenByIdOrUsername,
    fallbackPageToken:
      perPageTokenByIdOrUsername.size > 0 ? undefined : fallbackPageToken,
  });
  if (!token) return [];

  const posts = await fetchPagePosts(page, token);
  return posts.map((p) => ({
    id: p.id,
    created_time: p.created_time,
    message: p.message,
    permalink_url: p.permalink_url,
    full_picture: p.full_picture,
  }));
}

export async function aggregateWebWatch(): Promise<AggregationResult[]> {
  const { aggregateWebPagesWatch } = await import("@/lib/web-watch");
  const recentLimit = facebookCronRecentPostLimit();
  return Promise.all([
    aggregateFacebookWatchUrls(),
    aggregateFacebookPagesGraph({
      light: true,
      recentImportLimit: recentLimit,
    }),
    aggregateWebPagesWatch(),
  ]);
}
