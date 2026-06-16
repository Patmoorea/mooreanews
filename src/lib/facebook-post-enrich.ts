/**
 * Enrichissement Graph API + Open Graph pour import MooreaNews (texte, affiche, vidéo).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import { isFacebookJunkText } from "@/lib/facebook-import-filters";
import { fetchOpenGraph } from "@/lib/open-graph";
import { cleanImportedText } from "@/lib/html-entities";

export const GRAPH_POST_DETAIL_FIELDS =
  "id,message,permalink_url,created_time,full_picture,picture,status_type,attachments{description,title,media_type,type,url,unshimmed_url,target{id},media{image{src}},subattachments{data{description,title,media_type,type,url,unshimmed_url,target{id},media{image{src}}}}}";

export const MOOREANEWS_PAGE_ID = "350029589936";
/** Propriétaire alternatif dans les permaliens Graph — le texte y est parfois seulement lisible. */
export const MOOREANEWS_GRAPH_ALT_OWNER_ID = "1762281498446173";

export function mooreaNewsPostIdsFromFbid(fbid: string): string[] {
  const id = fbid.trim();
  if (!/^\d+$/.test(id)) return [];
  return [`${MOOREANEWS_PAGE_ID}_${id}`, `${MOOREANEWS_GRAPH_ALT_OWNER_ID}_${id}`];
}

function mergeFacebookPostsForImport(
  base: FacebookPostForImport,
  extra: FacebookPostForImport,
): FacebookPostForImport {
  const baseMsg = base.message?.trim() ?? "";
  const extraMsg = extra.message?.trim() ?? "";
  const baseJunk = !baseMsg || isFacebookJunkText(baseMsg);
  const extraJunk = !extraMsg || isFacebookJunkText(extraMsg);
  let message = base.message;
  if (extraJunk && !baseJunk) message = base.message;
  else if (baseJunk && !extraJunk) message = extra.message;
  else if (extraMsg.length > baseMsg.length) message = extra.message;
  else message = base.message ?? extra.message;

  const basePic = base.full_picture?.trim() ?? "";
  const extraPic = extra.full_picture?.trim() ?? "";
  const full_picture =
    extraPic.length > basePic.length ? extra.full_picture : base.full_picture ?? extra.full_picture;

  return {
    ...base,
    message,
    full_picture,
    created_time: base.created_time ?? extra.created_time,
    permalink_url: base.permalink_url ?? extra.permalink_url,
  };
}

type GraphAttachment = {
  description?: string;
  title?: string;
  media_type?: string;
  type?: string;
  url?: string;
  unshimmed_url?: string;
  target?: { id?: string };
  media?: { image?: { src?: string } };
  subattachments?: { data?: GraphAttachment[] };
};

export type GraphPostRaw = {
  id: string;
  message?: string;
  permalink_url?: string;
  created_time?: string;
  full_picture?: string;
  picture?: string | { data?: { url?: string } };
  status_type?: string;
  attachments?: { data?: GraphAttachment[] };
};

function pictureUrlFromGraph(
  picture: GraphPostRaw["picture"],
): string {
  if (!picture) return "";
  if (typeof picture === "string") return picture.trim();
  return picture.data?.url?.trim() ?? "";
}

function bestImageFromAttachments(
  attachments: GraphAttachment[] | undefined,
): string {
  let best = "";
  const walk = (items: GraphAttachment[] | undefined) => {
    for (const att of items ?? []) {
      const src = att.media?.image?.src?.trim() ?? "";
      if (src && src.length > best.length) best = src;
      walk(att.subattachments?.data);
    }
  };
  walk(attachments);
  return best;
}

function textFromAttachments(attachments: GraphAttachment[] | undefined): string {
  const parts: string[] = [];
  const walk = (items: GraphAttachment[] | undefined) => {
    for (const att of items ?? []) {
      for (const s of [att.title, att.description]) {
        const t = cleanImportedText(s?.trim() ?? "");
        if (t && !isFacebookJunkText(t) && !parts.includes(t)) parts.push(t);
      }
      walk(att.subattachments?.data);
    }
  };
  walk(attachments);
  return parts.join("\n\n");
}

function attachmentShareUrls(
  attachments: GraphAttachment[] | undefined,
): string[] {
  const urls: string[] = [];
  const walk = (items: GraphAttachment[] | undefined) => {
    for (const att of items ?? []) {
      for (const u of [att.unshimmed_url, att.url]) {
        const t = u?.trim();
        if (t?.startsWith("http") && !urls.includes(t)) urls.push(t);
      }
      walk(att.subattachments?.data);
    }
  };
  walk(attachments);
  return urls;
}

/** Partages Facebook : récupère texte + affiche du post d’origine. */
async function enrichFromSharedAttachmentTargets(
  attachments: GraphAttachment[] | undefined,
  token: string,
): Promise<{ message?: string; full_picture?: string }> {
  const out: { message?: string; full_picture?: string } = {};
  const seen = new Set<string>();

  const walk = async (items: GraphAttachment[] | undefined) => {
    for (const att of items ?? []) {
      const targetId = att.target?.id?.trim();
      if (
        targetId &&
        !seen.has(targetId) &&
        (att.type === "share" || att.media_type === "share")
      ) {
        seen.add(targetId);
        const shared = await fetchGraphPostById(targetId, token);
        if (shared?.message?.trim() && !isFacebookJunkText(shared.message)) {
          out.message = out.message
            ? `${out.message}\n\n${shared.message.trim()}`
            : shared.message.trim();
        }
        const pic = shared?.full_picture?.trim();
        if (pic && (!out.full_picture || pic.length > out.full_picture.length)) {
          out.full_picture = pic;
        }
      }
      await walk(att.subattachments?.data);
    }
  };

  await walk(attachments);
  return out;
}

/** Normalise un post Graph (images subattachments + texte attachment). */
export function normalizeGraphPostRaw(raw: GraphPostRaw): FacebookPostForImport {
  let message = cleanImportedText(raw.message?.trim() ?? "");
  let full_picture = raw.full_picture?.trim() ?? "";
  const graphPicture = pictureUrlFromGraph(raw.picture);
  if (graphPicture && graphPicture.length > full_picture.length) {
    full_picture = graphPicture;
  }
  const attImage = bestImageFromAttachments(raw.attachments?.data);
  if (attImage && attImage.length > full_picture.length) {
    full_picture = attImage;
  }
  const attText = textFromAttachments(raw.attachments?.data);
  if (attText && !message.includes(attText)) {
    message = message && !isFacebookJunkText(message)
      ? `${message}\n\n${attText}`
      : attText;
  }
  if (isFacebookJunkText(message)) {
    message = "";
  }

  return {
    id: raw.id,
    permalink_url: raw.permalink_url,
    created_time: raw.created_time,
    message: message || undefined,
    full_picture: full_picture || undefined,
  };
}

export function permalinkForPost(
  post: Pick<FacebookPostForImport, "id" | "permalink_url">,
  pageId = "350029589936",
): string {
  const numeric = post.id.split("_").pop() ?? post.id.replace(/\D/g, "");
  if (pageId === "350029589936" && numeric) {
    return `https://www.facebook.com/MooreaNews/posts/${numeric}`;
  }
  const link = post.permalink_url?.trim();
  if (link?.startsWith("http")) return link;
  if (numeric) {
    return `https://www.facebook.com/${pageId}/posts/${numeric}`;
  }
  return "https://www.facebook.com/MooreaNews";
}

/** Variantes d’URL pour récupérer texte + affiche via Open Graph. */
export function openGraphUrlsForFacebookPost(
  post: Pick<FacebookPostForImport, "id" | "permalink_url">,
  pageId = "350029589936",
): string[] {
  const numeric = post.id.split("_").pop() ?? post.id.replace(/\D/g, "");
  const graphLink = post.permalink_url?.trim();
  const candidates = [
    pageId === "350029589936" && numeric
      ? `https://www.facebook.com/MooreaNews/posts/${numeric}`
      : undefined,
    numeric
      ? `https://www.facebook.com/permalink.php?story_fbid=${numeric}&id=${pageId}`
      : undefined,
    numeric ? `https://www.facebook.com/photo/?fbid=${numeric}&id=${pageId}` : undefined,
    numeric
      ? `https://www.facebook.com/${pageId}/posts/${numeric}`
      : undefined,
    graphLink &&
    graphLink.startsWith("http") &&
    !graphLink.includes("1762281498446173")
      ? graphLink
      : undefined,
  ].filter((u): u is string => Boolean(u?.startsWith("http")));

  return [...new Set(candidates)];
}

function isWeakOgText(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 12) return true;
  if (/^facebook$/i.test(t)) return true;
  if (/^mooreanews$/i.test(t)) return true;
  return isFacebookJunkText(t);
}

/** Images via endpoint attachments (si full_picture absent). */
async function fetchGraphAttachmentImage(
  postId: string,
  token: string,
): Promise<string | null> {
  const apiUrl = new URL(
    `https://graph.facebook.com/v21.0/${postId}/attachments`,
  );
  apiUrl.searchParams.set(
    "fields",
    "media{image{src}},subattachments{data{media{image{src}}}}",
  );
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: GraphAttachment[];
  };
  return bestImageFromAttachments(json.data) || null;
}

/** Détail brut Graph (partages, pièces jointes). */
async function fetchGraphPostRawById(
  postId: string,
  token: string,
): Promise<GraphPostRaw | null> {
  const apiUrl = new URL(`https://graph.facebook.com/v21.0/${postId}`);
  apiUrl.searchParams.set("fields", GRAPH_POST_DETAIL_FIELDS);
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const body = await res.text();
  if (!body.trim()) return null;
  try {
    const json = JSON.parse(body) as GraphPostRaw;
    return json?.id ? json : null;
  } catch {
    return null;
  }
}

/** Détail complet d’un post via Graph API (image + texte manquants sur /posts). */
export async function fetchGraphPostById(
  postId: string,
  token: string,
): Promise<FacebookPostForImport | null> {
  const json = await fetchGraphPostRawById(postId, token);
  if (!json) return null;
  let post = normalizeGraphPostRaw(json);
  if (!post.full_picture) {
    const attImg = await fetchGraphAttachmentImage(postId, token);
    if (attImg) post = { ...post, full_picture: attImg };
  }
  return post;
}

/** MooreaNews : essaie l’ID page canonique + l’ID propriétaire des permaliens Graph. */
export async function fetchMooreaNewsGraphPostByFbid(
  fbid: string,
  token: string,
): Promise<FacebookPostForImport | null> {
  let best: FacebookPostForImport | null = null;
  for (const postId of mooreaNewsPostIdsFromFbid(fbid)) {
    const post = await fetchGraphPostById(postId, token);
    if (!post) continue;
    best = best ? mergeFacebookPostsForImport(best, post) : post;
  }
  return best;
}

async function enrichFromOpenGraph(
  post: FacebookPostForImport,
  pageId: string,
  force: boolean,
  extraUrls: string[] = [],
): Promise<FacebookPostForImport> {
  let message = post.message?.trim() ?? "";
  let full_picture = post.full_picture?.trim() ?? "";
  const uniqueUrls = [
    ...new Set([
      ...extraUrls.filter((u) => u.startsWith("http")),
      ...openGraphUrlsForFacebookPost(post, pageId),
    ]),
  ];
  if (!force && message && full_picture && !isFacebookJunkText(message)) {
    return post;
  }

  for (const url of uniqueUrls) {
    try {
      const og = await fetchOpenGraph(url);
      if (!og) continue;
      const ogText = cleanImportedText(
        og.description?.trim() || og.title?.trim() || "",
      );
      if (
        ogText &&
        !isWeakOgText(ogText) &&
        (ogText.length > message.length || !message || isFacebookJunkText(message))
      ) {
        message = ogText;
      }
      const ogImage = og.imageUrl?.trim();
      if (ogImage?.startsWith("http") && ogImage.length > full_picture.length) {
        full_picture = ogImage;
      }
      if (!force && message && full_picture) break;
    } catch {
      /* essai URL suivante */
    }
  }

  if (isFacebookJunkText(message)) message = "";

  return {
    ...post,
    permalink_url: post.permalink_url ?? permalinkForPost(post, pageId),
    message: message || undefined,
    full_picture: full_picture || undefined,
  };
}

/** Graph post-by-id + Open Graph — pour MooreaNews (tout le fil). */
export async function enrichFacebookPostForImport(
  post: FacebookPostForImport,
  token: string | undefined,
  options: { pageId?: string; importAll?: boolean } = {},
): Promise<FacebookPostForImport> {
  const pageId = options.pageId ?? "350029589936";
  const listPicture = post.full_picture?.trim() ?? "";
  let current = normalizeGraphPostRaw(post as GraphPostRaw);

  const messageIsJunk = isFacebookJunkText(current.message?.trim() ?? "");
  const needsGraph =
    Boolean(token) &&
    (Boolean(options.importAll) ||
      !current.full_picture ||
      !current.message ||
      messageIsJunk);

  let shareUrls: string[] = [];
  if (needsGraph && token) {
    const fbid = post.id.split("_").pop() ?? "";
    const postIds =
      pageId === MOOREANEWS_PAGE_ID && /^\d+$/.test(fbid)
        ? mooreaNewsPostIdsFromFbid(fbid)
        : [post.id];

    for (const graphPostId of postIds) {
      const raw = await fetchGraphPostRawById(graphPostId, token);
      if (!raw) continue;
      shareUrls.push(...attachmentShareUrls(raw.attachments?.data));
      let detailed = normalizeGraphPostRaw(raw);
      const shared = await enrichFromSharedAttachmentTargets(
        raw.attachments?.data,
        token,
      );
      if (shared.message && !isFacebookJunkText(shared.message)) {
        detailed = {
          ...detailed,
          message: detailed.message
            ? `${detailed.message}\n\n${shared.message}`
            : shared.message,
        };
      }
      if (shared.full_picture) {
        detailed = { ...detailed, full_picture: shared.full_picture };
      }
      if (!detailed.full_picture) {
        const attImg = await fetchGraphAttachmentImage(graphPostId, token);
        if (attImg) detailed = { ...detailed, full_picture: attImg };
      }
      const detailedJunk = isFacebookJunkText(detailed.message?.trim() ?? "");
      const candidate: FacebookPostForImport = {
        id: post.id,
        message: detailedJunk ? undefined : detailed.message,
        full_picture: detailed.full_picture,
        permalink_url: detailed.permalink_url,
        created_time: detailed.created_time,
      };
      current = mergeFacebookPostsForImport(current, candidate);
      if (
        current.message?.trim() &&
        !isFacebookJunkText(current.message) &&
        current.full_picture?.trim()
      ) {
        break;
      }
    }
    shareUrls = [...new Set(shareUrls)];
  }

  if (isFacebookJunkText(current.message?.trim() ?? "")) {
    current = { ...current, message: undefined };
  }

  const stillNeedsOg =
    Boolean(options.importAll) ||
    messageIsJunk ||
    !current.full_picture ||
    !current.message;

  const enriched = await enrichFromOpenGraph(
    {
      ...current,
      permalink_url: current.permalink_url ?? permalinkForPost(current, pageId),
    },
    pageId,
    stillNeedsOg,
    shareUrls,
  );

  if (!enriched.full_picture?.trim() && listPicture) {
    return { ...enriched, full_picture: listPicture };
  }
  return enriched;
}

/** Limite URL couverture (PostgREST / affichage). */
export function sanitizeCoverUrl(url: string | undefined | null): string | null {
  const u = url?.trim();
  if (!u?.startsWith("http")) return null;
  return u.length > 2048 ? u.slice(0, 2048) : u;
}
