/**
 * Coupures Te Ito Rau sans Graph API — OG, base veille, mbasic Facebook.
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";
import { externalIdFromFacebookUrl } from "@/lib/facebook-url";
import { cleanImportedText } from "@/lib/html-entities";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { outageFromText, isTeItoRauOutageMessage } from "@/lib/outage-text-parse";
import type { UtilityOutage } from "@/lib/utility-outages";
import { TE_ITO_RAU_FACEBOOK_PAGE } from "@/lib/watch-sources";

const TE_ITO_PAGE = TE_ITO_RAU_FACEBOOK_PAGE.homepage;
const TE_ITO_MBASIC = "https://mbasic.facebook.com/profile.php?id=100088637945937&v=timeline";

const FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
};

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const u = raw.trim();
    if (!u.includes("facebook.com") || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

/** URLs Te Ito Rau : env + page officielle. */
export function teItoRauWatchUrls(): string[] {
  const fromEnv = (process.env.TE_ITO_RAU_FB_POST_URLS ?? "")
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter((u) => u.includes("facebook.com"));
  return uniqueUrls([...fromEnv, TE_ITO_PAGE]);
}

async function teItoPostUrlsFromDatabase(): Promise<string[]> {
  const admin = getAdminSupabase();
  if (!admin) return [];

  const urls: string[] = [];
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

  const { data: ext } = await admin
    .from("external_articles")
    .select("url, title, excerpt")
    .gte("published_at", since)
    .or(
      "url.ilike.%100088637945937%,url.ilike.%te%ito%rau%,title.ilike.%coupure%,excerpt.ilike.%coupure%,title.ilike.%électricité%,excerpt.ilike.%Te Ito Rau%",
    )
    .order("published_at", { ascending: false })
    .limit(40);

  for (const row of ext ?? []) {
    if (row.url?.includes("facebook.com")) {
      urls.push(row.url);
      continue;
    }
    const corpus = `${row.title ?? ""} ${row.excerpt ?? ""}`.trim();
    if (/coupure|électricité|electricite|te ito rau/i.test(corpus) && row.url) {
      urls.push(row.url);
    }
  }

  const { data: fbWatch } = await admin
    .from("external_articles")
    .select("url, title, excerpt")
    .eq("source_id", "facebook-watch")
    .gte("published_at", since)
    .or(
      "url.ilike.%100088637945937%,title.ilike.%coupure%,excerpt.ilike.%coupure%,excerpt.ilike.%INFO COUPURE%",
    )
    .order("published_at", { ascending: false })
    .limit(20);

  for (const row of fbWatch ?? []) {
    if (row.url) urls.push(row.url);
  }

  return urls;
}

/** Extrait des permalinks récents depuis mbasic (sans jeton Meta). */
async function teItoPostUrlsFromMbasic(limit = 12): Promise<string[]> {
  try {
    const res = await fetch(TE_ITO_MBASIC, {
      headers: FETCH_HEADERS,
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) return [];

    const html = await res.text();
    const urls: string[] = [];
    const pageId = "100088637945937";

    for (const m of html.matchAll(
      /href="(\/(story\.php\?[^"]+|photo\.php\?[^"]+|watch\/\?[^"]+))"/gi,
    )) {
      const path = m[1].replace(/&amp;/g, "&");
      if (!/story_fbid|fbid|v=|id=/.test(path)) continue;
      const abs = path.startsWith("http")
        ? path
        : `https://mbasic.facebook.com${path}`;
      urls.push(abs);
      if (urls.length >= limit) break;
    }

    for (const m of html.matchAll(
      /href="(https:\/\/(?:www|mbasic)\.facebook\.com\/[^"]*(?:posts|permalink|photo)[^"]*)"/gi,
    )) {
      urls.push(m[1].replace(/&amp;/g, "&"));
      if (urls.length >= limit) break;
    }

    return uniqueUrls(
      urls.map((u) => {
        if (u.includes("story.php")) {
          const q = u.includes("?") ? u.slice(u.indexOf("?")) : "";
          return `https://www.facebook.com/profile.php?id=${pageId}${q.replace(/^\?/, "&")}`;
        }
        return u.replace("mbasic.facebook.com", "www.facebook.com");
      }),
    ).slice(0, limit);
  } catch {
    return [];
  }
}

async function outagesFromOgUrls(urls: string[]): Promise<UtilityOutage[]> {
  const { fetchOpenGraph } = await import("@/lib/open-graph");
  const { externalIdFromFacebookUrl } = await import("@/lib/facebook-url");
  const outages: UtilityOutage[] = [];

  for (const url of urls) {
    try {
      const og = await fetchOpenGraph(url);
      if (!og) continue;
      const corpus = `${og.title} ${og.description}`.trim();
      const o = outageFromText({
        id: `teito-og-${externalIdFromFacebookUrl(url)}`,
        title: og.title,
        corpus,
        sourceUrl: og.url || url,
        sourceLabel: "Te Ito Rau — Facebook",
      });
      if (o) outages.push(o);
    } catch {
      /* ignore */
    }
  }

  return outages;
}

async function collectTeItoRauPostUrls(): Promise<string[]> {
  const [dbUrls, mbasicUrls] = await Promise.all([
    teItoPostUrlsFromDatabase(),
    teItoPostUrlsFromMbasic(),
  ]);
  return uniqueUrls([
    ...teItoRauWatchUrls(),
    ...dbUrls,
    ...mbasicUrls,
  ]).slice(0, 25);
}

/** Importe les posts coupures Te Ito Rau via OG / mbasic (sans Graph API). */
export async function importTeItoRauOutageArticlesFromFallback(options?: {
  userToken?: string;
}): Promise<{ articlesCreated: number; errors: string[] }> {
  const errors: string[] = [];
  const urls = await collectTeItoRauPostUrls();
  if (urls.length === 0) {
    return { articlesCreated: 0, errors };
  }

  const { fetchOpenGraph } = await import("@/lib/open-graph");
  const posts: FacebookPostForImport[] = [];
  const token =
    options?.userToken?.trim() ??
    process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim() ??
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ??
    "";

  for (const url of urls) {
    try {
      const og = await fetchOpenGraph(url);
      if (!og) continue;
      const corpus = cleanImportedText(`${og.title} ${og.description}`).trim();
      if (!corpus || !isTeItoRauOutageMessage(corpus)) continue;
      if (!outageFromText({
        id: `teito-check-${externalIdFromFacebookUrl(url)}`,
        title: og.title,
        corpus,
        sourceUrl: og.url || url,
        sourceLabel: "Te Ito Rau — Facebook",
      })) {
        continue;
      }
      posts.push({
        id: `${TE_ITO_RAU_FACEBOOK_PAGE.pageId}_${externalIdFromFacebookUrl(url)}`,
        message: corpus,
        permalink_url: og.url || url,
        full_picture: og.imageUrl?.trim() || undefined,
        created_time: new Date().toISOString(),
      });
    } catch (e) {
      errors.push(`og ${url}: ${String(e)}`);
    }
  }

  if (posts.length === 0) {
    return { articlesCreated: 0, errors };
  }

  try {
    const imported = await importFacebookPostsAsContent(posts, {
      pageKey: "te-ito-rau",
      pageName: TE_ITO_RAU_FACEBOOK_PAGE.name,
      homepage: TE_ITO_RAU_FACEBOOK_PAGE.homepage,
      authorLabel: `${TE_ITO_RAU_FACEBOOK_PAGE.name} (Facebook)`,
      tag: "te-ito-rau",
      importAllFeedPosts: true,
      pageAccessToken: token,
      graphPageId: TE_ITO_RAU_FACEBOOK_PAGE.pageId,
    });
    errors.push(...imported.errors);
    return { articlesCreated: imported.articlesCreated, errors };
  } catch (e) {
    errors.push(String(e));
    return { articlesCreated: 0, errors };
  }
}

/** Repli Te Ito Rau quand Graph API indisponible ou vide. */
export async function fetchOutagesFromTeItoRauFallback(): Promise<{
  outages: UtilityOutage[];
  urlsTried: number;
  sources: string[];
}> {
  const urls = await collectTeItoRauPostUrls();

  const outages = await outagesFromOgUrls(urls);

  const sources: string[] = [];
  if (urls.length > 0) sources.push(`urls:${urls.length}`);
  if (outages.length > 0) sources.push(`parsed:${outages.length}`);

  return { outages, urlsTried: urls.length, sources };
}
