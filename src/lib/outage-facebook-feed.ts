/**
 * Coupures depuis Facebook (Graph API) — Te Ito Rau, MooreaNews, Commune.
 * Ne dépend pas de l’import articles : lecture directe des posts.
 */

import { importFacebookPostsAsContent } from "@/lib/facebook-content-import";
import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import {
  normalizeGraphPostRaw,
  type GraphPostRaw,
} from "@/lib/facebook-post-enrich";
import { refreshFacebookUserTokenInProcess } from "@/lib/facebook-token";
import {
  outageFromText,
  type OutageTextSource,
} from "@/lib/outage-text-parse";
import type { UtilityOutage } from "@/lib/utility-outages";
import {
  FACEBOOK_PAGE_WATCHES,
  TE_ITO_RAU_FACEBOOK_PAGE,
  type FacebookPageWatch,
} from "@/lib/watch-sources";

const OUTAGE_FACEBOOK_PAGES: FacebookPageWatch[] = [
  ...FACEBOOK_PAGE_WATCHES,
  TE_ITO_RAU_FACEBOOK_PAGE,
];

const GRAPH_VERSION = "v21.0";
const GRAPH_POST_FIELDS =
  "id,message,permalink_url,created_time,full_picture,attachments{description,title,media{image{src}}}";

type MeAccountsPage = {
  id: string;
  username?: string;
  access_token?: string;
};

function isTeItoRauOutageMessage(message: string): boolean {
  const n = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (!/coupure|panne|entretien de poste|entretien poste/.test(n)) return false;
  return (
    n.includes("ito rau") ||
    n.includes("te ito") ||
    n.includes("moorea") ||
    n.includes("tiahura") ||
    n.includes("maharepa") ||
    n.includes("afareaitu") ||
    n.includes("paopao") ||
    n.includes("papetoai") ||
    n.includes("haapiti") ||
    n.includes("temae") ||
    n.includes("vaiare")
  );
}

async function fetchMeAccounts(userToken: string): Promise<MeAccountsPage[]> {
  const apiUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`);
  apiUrl.searchParams.set("fields", "id,name,username,access_token");
  apiUrl.searchParams.set("limit", "200");
  apiUrl.searchParams.set("access_token", userToken);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: MeAccountsPage[] };
  return json.data ?? [];
}

/** Résout une URL Facebook → id Graph (contourne profile.php?id=…). */
export async function resolveGraphIdFromUrl(
  pageUrl: string,
  token: string,
): Promise<string | null> {
  const apiUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/`);
  apiUrl.searchParams.set("id", pageUrl);
  apiUrl.searchParams.set("fields", "id");
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id?.trim() ?? null;
}

async function fetchGraphPostsOnce(
  nodeId: string,
  token: string,
  limit: number,
): Promise<GraphPostRaw[]> {
  const apiUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${nodeId}/posts`);
  apiUrl.searchParams.set("fields", GRAPH_POST_FIELDS);
  apiUrl.searchParams.set("limit", String(limit));
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const json = (await res.json()) as { data?: GraphPostRaw[] };
  return json.data ?? [];
}

/** Posts via lookup URL (?id=homepage&fields=posts{…}). */
async function fetchGraphPostsViaUrlLookup(
  pageUrl: string,
  token: string,
  limit: number,
): Promise<GraphPostRaw[]> {
  const apiUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/`);
  apiUrl.searchParams.set("id", pageUrl);
  apiUrl.searchParams.set(
    "fields",
    `posts.limit(${limit}){${GRAPH_POST_FIELDS}}`,
  );
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const json = (await res.json()) as { posts?: { data?: GraphPostRaw[] } };
  return json.posts?.data ?? [];
}

async function pickTokenForPage(
  page: FacebookPageWatch,
  userToken: string | undefined,
  pageTokens: Map<string, string>,
  fallbackPageToken: string | undefined,
): Promise<string | null> {
  if (page.id === "te-ito-rau" && userToken) return userToken;

  const fromMap =
    pageTokens.get(page.pageId) ??
    pageTokens.get(page.pageId.toLowerCase()) ??
    null;
  if (fromMap) return fromMap;

  if (page.id === "te-ito-rau") return userToken ?? null;
  if (page.id === "moorea-news") {
    return fallbackPageToken ?? userToken ?? null;
  }
  return userToken ?? fallbackPageToken ?? null;
}

async function loadPageTokens(userToken: string | undefined): Promise<{
  userToken: string | undefined;
  pageTokens: Map<string, string>;
  fallbackPageToken: string | undefined;
}> {
  let token = userToken;
  const pageTokens = new Map<string, string>();
  const fallbackPageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();

  if (token) {
    const refreshed = await refreshFacebookUserTokenInProcess();
    if (refreshed.token) token = refreshed.token;
    for (const acc of await fetchMeAccounts(token)) {
      if (acc.access_token && acc.id) pageTokens.set(acc.id, acc.access_token);
      if (acc.access_token && acc.username) {
        pageTokens.set(acc.username, acc.access_token);
        pageTokens.set(acc.username.toLowerCase(), acc.access_token);
      }
    }
  }

  return { userToken: token, pageTokens, fallbackPageToken };
}

/** Posts Graph API d’une page (URL lookup pour Te Ito Rau). Ne lève pas d’exception. */
export async function fetchFacebookPagePostsForWatch(
  page: FacebookPageWatch,
  token: string,
): Promise<GraphPostRaw[]> {
  try {
    return await fetchPostsForPage(page, token);
  } catch {
    return [];
  }
}

async function fetchPostsForPage(
  page: FacebookPageWatch,
  token: string,
): Promise<GraphPostRaw[]> {
  const limit = page.id === "moorea-news" ? 25 : page.id === "te-ito-rau" ? 20 : 15;

  if (page.id === "te-ito-rau") {
    const viaLookup = await fetchGraphPostsViaUrlLookup(page.homepage, token, limit);
    if (viaLookup.length > 0) return viaLookup;

    const resolved = await resolveGraphIdFromUrl(page.homepage, token);
    if (resolved) {
      const viaId = await fetchGraphPostsOnce(resolved, token, limit);
      if (viaId.length > 0) return viaId;
    }

    const viaNumeric = await fetchGraphPostsOnce(page.pageId, token, limit);
    return viaNumeric;
  }

  const nodeId = /^\d+$/.test(page.pageId)
    ? page.pageId
    : (await resolveGraphIdFromUrl(page.homepage, token)) ?? page.pageId;

  return fetchGraphPostsOnce(nodeId, token, limit);
}

function postToOutage(
  post: GraphPostRaw,
  page: FacebookPageWatch,
  sourceLabel: string,
): UtilityOutage | null {
  const normalized = normalizeGraphPostRaw(post);
  const message = normalized.message?.trim() ?? "";
  if (!message || !isTeItoRauOutageMessage(message)) return null;

  const link =
    normalized.permalink_url ??
    `${page.homepage}/posts/${normalized.id.split("_").pop() ?? normalized.id}`;

  const firstLine = message.split("\n")[0]?.trim().slice(0, 200);
  const isTeIto =
    page.id === "te-ito-rau" ||
    /te ito rau|ito rau no moorea/i.test(message);

  return outageFromText({
    id: `fb-${page.id}-${normalized.id}`,
    title: firstLine || `${page.name} — coupure`,
    corpus: message,
    sourceUrl: link,
    sourceLabel: isTeIto ? "Te Ito Rau — Facebook" : sourceLabel,
  });
}

/** Lit les posts Facebook configurés et extrait les coupures Moorea. */
export async function fetchOutagesFromFacebookFeeds(): Promise<{
  outages: UtilityOutage[];
  errors: string[];
  postsImported: number;
}> {
  const errors: string[] = [];
  const outages: UtilityOutage[] = [];

  let userToken = process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim();
  const { userToken: ut, pageTokens, fallbackPageToken } =
    await loadPageTokens(userToken);
  userToken = ut;

  if (!userToken && !fallbackPageToken) {
    return { outages, errors, postsImported: 0 };
  }

  const postsForImport: {
    posts: FacebookPostForImport[];
    page: FacebookPageWatch;
    token: string;
  }[] = [];

  for (const page of OUTAGE_FACEBOOK_PAGES) {
    const token = await pickTokenForPage(
      page,
      userToken,
      pageTokens,
      fallbackPageToken,
    );
    if (!token) continue;

    try {
      const rawPosts = await fetchPostsForPage(page, token);
      for (const raw of rawPosts) {
        const o = postToOutage(raw, page, `${page.name} (Facebook)`);
        if (o) outages.push(o);
      }

      const outagePosts = rawPosts.filter((p) =>
        isTeItoRauOutageMessage(normalizeGraphPostRaw(p).message ?? ""),
      );
      if (
        outagePosts.length > 0 &&
        (page.id === "te-ito-rau" ||
          page.id === "moorea-news" ||
          page.id === "commune-moorea")
      ) {
        postsForImport.push({
          posts: outagePosts.map((p) => normalizeGraphPostRaw(p)),
          page,
          token,
        });
      }
    } catch (e) {
      errors.push(`${page.name}: ${String(e)}`);
    }
  }

  let postsImported = 0;
  if (
    process.env.FACEBOOK_IMPORT_AS_ARTICLES === "true" &&
    postsForImport.length > 0
  ) {
    for (const batch of postsForImport) {
      const isTeIto = batch.page.id === "te-ito-rau";
      const isMooreaNews = batch.page.id === "moorea-news";
      try {
        const imported = await importFacebookPostsAsContent(batch.posts, {
          pageKey: isTeIto
            ? "te-ito-rau"
            : isMooreaNews
              ? "mooreanews"
              : "commune",
          pageName: batch.page.name,
          homepage: batch.page.homepage,
          authorLabel: `${batch.page.name} (Facebook)`,
          tag: isTeIto
            ? "te-ito-rau"
            : isMooreaNews
              ? "moorea-news-fb"
              : "commune-moorea",
          allowFerryAlerts: isMooreaNews,
          importAllFeedPosts: isTeIto || isMooreaNews,
          pageAccessToken: batch.token,
          graphPageId: batch.page.pageId,
        });
        postsImported += imported.articlesCreated;
      } catch (e) {
        errors.push(`import ${batch.page.id}: ${String(e)}`);
      }
    }
  }

  return { outages, errors, postsImported };
}

/** Permalinks Facebook supplémentaires (env) → OG → coupure. */
export async function fetchOutagesFromExtraFacebookUrls(
  urls: string[],
): Promise<UtilityOutage[]> {
  const { fetchOpenGraph } = await import("@/lib/open-graph");
  const { externalIdFromFacebookUrl } = await import("@/lib/facebook-url");
  const outages: UtilityOutage[] = [];

  for (const url of urls) {
    try {
      const og = await fetchOpenGraph(url);
      if (!og) continue;
      const corpus = `${og.title} ${og.description}`.trim();
      const o = outageFromText({
        id: `fb-url-${externalIdFromFacebookUrl(url)}`,
        title: og.title,
        corpus,
        sourceUrl: og.url || url,
        sourceLabel: "Facebook — veille",
      });
      if (o) outages.push(o);
    } catch {
      /* ignore */
    }
  }

  return outages;
}

export function extraTeItoRauPostUrlsFromEnv(): string[] {
  const raw = process.env.TE_ITO_RAU_FB_POST_URLS ?? "";
  return raw
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter((u) => u.includes("facebook.com"));
}

export type { OutageTextSource };
