/**
 * Veille Facebook : Open Graph sur URLs configurées + Graph API (optionnel).
 */

import type { AggregationResult } from "@/lib/aggregator";
import { externalIdFromFacebookUrl, isFacebookUrl } from "@/lib/facebook-url";
import { fetchOpenGraph } from "@/lib/open-graph";
import { getAdminSupabase } from "@/lib/supabase/admin";
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

  for (const url of urls) {
    if (!isFacebookUrl(url)) continue;
    const fallbackTitle = labelForFacebookUrl(url);
    try {
      const og = await fetchOpenGraph(url);
      const title = og?.title?.trim() || fallbackTitle;
      result.matched += 1;
      rows.push({
        source_id: "facebook-watch",
        source_name: og?.title ? "Facebook — veille" : "Facebook — lien surveillé",
        external_id: externalIdFromFacebookUrl(url),
        url: og?.url || url,
        title,
        excerpt: og?.description || null,
        image_url: og?.imageUrl ?? null,
        published_at: new Date().toISOString(),
      });
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

  return result;
}

async function fetchPagePosts(
  page: FacebookPageWatch,
  token: string
): Promise<GraphPost[]> {
  const fields = "id,message,permalink_url,created_time,full_picture";
  const apiUrl = new URL(
    `https://graph.facebook.com/v21.0/${page.pageId}/posts`
  );
  apiUrl.searchParams.set("fields", fields);
  apiUrl.searchParams.set("limit", "15");
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Graph API ${page.pageId}: HTTP ${res.status} ${body.slice(0, 120)}`);
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

  const fallbackPageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  const userToken = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim();
  if (!fallbackPageToken && !userToken) return result;

  const supabase = getAdminSupabase();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
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

  for (const page of FACEBOOK_PAGE_WATCHES) {
    try {
      const tokenForPage = pickTokenForPage({
        page,
        perPageTokenByIdOrUsername,
        fallbackPageToken,
      });
      if (!tokenForPage) {
        result.errors.push(`Token manquant pour ${page.pageId}`);
        continue;
      }
      const posts = await fetchPagePosts(page, tokenForPage);
      result.fetched += posts.length;
      for (const post of posts) {
        const title =
          post.message?.split("\n")[0]?.trim().slice(0, 200) ||
          `${page.name} — publication`;
        const link = post.permalink_url ?? `${page.homepage}/posts/${post.id}`;
        rows.push({
          source_id: `facebook-page-${page.id}`,
          source_name: page.name,
          external_id: `fb-graph-${post.id}`,
          url: link,
          title,
          excerpt: post.message?.slice(0, 400) ?? null,
          image_url: post.full_picture ?? null,
          published_at: post.created_time ?? new Date().toISOString(),
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

  return result;
}

export async function aggregateWebWatch(): Promise<AggregationResult[]> {
  return Promise.all([
    aggregateFacebookWatchUrls(),
    aggregateFacebookPagesGraph(),
  ]);
}
