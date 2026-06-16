/**
 * Enrichissement Graph API + Open Graph pour import MooreaNews (texte, affiche, vidéo).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import { isFacebookJunkText } from "@/lib/facebook-import-filters";
import { fetchOpenGraph } from "@/lib/open-graph";
import { cleanImportedText } from "@/lib/html-entities";
import {
  mooreaNewsGraphPageId,
  mooreaNewsLinkPageId,
} from "@/lib/facebook-mooreanews-id";

export const GRAPH_POST_DETAIL_FIELDS =
  "id,message,permalink_url,created_time,full_picture,picture,status_type,attachments{description,title,media_type,type,url,unshimmed_url,target{id},media{image{src}},subattachments{data{description,title,media_type,type,url,unshimmed_url,target{id},media{image{src}}}}}";

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
  pageId = mooreaNewsGraphPageId(),
): string {
  const link = post.permalink_url?.trim();
  if (link?.startsWith("http")) return link;
  const numeric = post.id.split("_").pop() ?? post.id;
  const linkPageId = mooreaNewsLinkPageId();
  return `https://www.facebook.com/${linkPageId}/posts/${numeric}`;
}

/** Variantes d’URL pour récupérer texte + affiche via Open Graph. */
export function openGraphUrlsForFacebookPost(
  post: Pick<FacebookPostForImport, "id" | "permalink_url">,
  pageId = mooreaNewsGraphPageId(),
): string[] {
  const numeric = post.id.split("_").pop() ?? post.id.replace(/\D/g, "");
  const linkPageId = mooreaNewsLinkPageId();
  const candidates = [
    post.permalink_url?.trim(),
    permalinkForPost(post, pageId),
    numeric
      ? `https://www.facebook.com/${linkPageId}/posts/${numeric}`
      : undefined,
    numeric
      ? `https://www.facebook.com/permalink.php?story_fbid=${numeric}&id=${pageId}`
      : undefined,
    numeric
      ? `https://www.facebook.com/permalink.php?story_fbid=${numeric}&id=${linkPageId}`
      : undefined,
    numeric
      ? `https://www.facebook.com/photo/?fbid=${numeric}&id=${pageId}`
      : undefined,
    numeric ? `https://www.facebook.com/photo/?fbid=${numeric}` : undefined,
    numeric
      ? `https://www.facebook.com/${pageId}/posts/${numeric}`
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

type GraphUploadedPhoto = {
  id: string;
  created_time?: string;
  link?: string;
  name?: string;
  alt_text?: string;
  images?: { source?: string; width?: number; height?: number }[];
};

/** Photo album MooreaNews (texte + affiche hors fil /posts). */
async function fetchGraphPhotoAsPost(
  photoId: string,
  graphPageId: string,
  token: string,
): Promise<FacebookPostForImport | null> {
  for (const id of [...new Set([photoId, `${graphPageId}_${photoId}`])]) {
    const apiUrl = new URL(`https://graph.facebook.com/v21.0/${encodeURIComponent(id)}`);
    apiUrl.searchParams.set(
      "fields",
      "id,created_time,link,images,name,alt_text",
    );
    apiUrl.searchParams.set("access_token", token);
    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    if (!res.ok) continue;
    const json = (await res.json()) as GraphUploadedPhoto;
    if (!json.id) continue;
    const bestImage = [...(json.images ?? [])].sort(
      (a, b) => (b.width ?? 0) - (a.width ?? 0),
    )[0]?.source?.trim();
    const caption = cleanImportedText(
      json.name?.trim() || json.alt_text?.trim() || "",
    );
    return {
      id: `${graphPageId}_${json.id.replace(/^.*_/, "")}`,
      created_time: json.created_time,
      permalink_url: json.link?.trim() || permalinkForPost({ id: `${graphPageId}_${photoId}` }),
      message: caption || undefined,
      full_picture: bestImage || undefined,
    };
  }
  return null;
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
    const raw = await fetchGraphPostRawById(post.id, token);
    if (raw) {
      shareUrls = attachmentShareUrls(raw.attachments?.data);
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
        const attImg = await fetchGraphAttachmentImage(post.id, token);
        if (attImg) detailed = { ...detailed, full_picture: attImg };
      }
      const detailedJunk = isFacebookJunkText(detailed.message?.trim() ?? "");
      current = {
        ...current,
        message: detailedJunk ? undefined : detailed.message,
        full_picture: detailed.full_picture ?? current.full_picture,
        permalink_url: detailed.permalink_url ?? current.permalink_url,
        created_time: detailed.created_time ?? current.created_time,
      };
    }
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

  let result = enriched;
  if (!result.full_picture?.trim() && listPicture) {
    result = { ...result, full_picture: listPicture };
  }

  const needsMore =
    Boolean(options.importAll) &&
    Boolean(token) &&
    (!result.message?.trim() || !result.full_picture?.trim());
  if (needsMore) {
    const numeric = post.id.split("_").pop() ?? post.id.replace(/\D/g, "");
    if (numeric) {
      const photoPost = await fetchGraphPhotoAsPost(numeric, pageId, token!);
      if (photoPost) {
        result = {
          ...result,
          message: result.message?.trim() || photoPost.message,
          full_picture: result.full_picture?.trim() || photoPost.full_picture,
          permalink_url:
            result.permalink_url?.trim() ||
            photoPost.permalink_url ||
            permalinkForPost(result, pageId),
          created_time: result.created_time ?? photoPost.created_time,
        };
      }
      if (!result.message?.trim() || !result.full_picture?.trim()) {
        const ogBoost = await enrichFromOpenGraph(
          {
            ...result,
            permalink_url: result.permalink_url ?? permalinkForPost(result, pageId),
          },
          pageId,
          true,
          [
            `https://www.facebook.com/photo/?fbid=${numeric}&id=${pageId}`,
            `https://www.facebook.com/${mooreaNewsLinkPageId()}/posts/${numeric}`,
          ],
        );
        result = {
          ...result,
          message: result.message?.trim() || ogBoost.message,
          full_picture: result.full_picture?.trim() || ogBoost.full_picture,
          permalink_url: ogBoost.permalink_url ?? result.permalink_url,
        };
      }
    }
  }

  return result;
}

/** Limite URL couverture (PostgREST / affichage). */
export function sanitizeCoverUrl(url: string | undefined | null): string | null {
  const u = url?.trim();
  if (!u?.startsWith("http")) return null;
  return u.length > 2048 ? u.slice(0, 2048) : u;
}
