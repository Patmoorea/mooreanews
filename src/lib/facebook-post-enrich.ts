/**
 * Enrichissement Graph API + Open Graph pour import MooreaNews (texte, affiche, vidéo).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import { isFacebookJunkText } from "@/lib/facebook-import-filters";
import { fetchOpenGraph } from "@/lib/open-graph";
import { cleanImportedText } from "@/lib/html-entities";

export const GRAPH_POST_DETAIL_FIELDS =
  "id,message,permalink_url,created_time,full_picture,picture,status_type,attachments{description,title,media_type,url,media{image{src}},subattachments{data{description,title,media_type,media{image{src}}}}}";

type GraphAttachment = {
  description?: string;
  title?: string;
  media_type?: string;
  url?: string;
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
  const link = post.permalink_url?.trim();
  if (link?.startsWith("http")) return link;
  const numeric = post.id.split("_").pop() ?? post.id;
  return `https://www.facebook.com/${pageId}/posts/${numeric}`;
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

/** Détail complet d’un post via Graph API (image + texte manquants sur /posts). */
export async function fetchGraphPostById(
  postId: string,
  token: string,
): Promise<FacebookPostForImport | null> {
  const apiUrl = new URL(`https://graph.facebook.com/v21.0/${postId}`);
  apiUrl.searchParams.set("fields", GRAPH_POST_DETAIL_FIELDS);
  apiUrl.searchParams.set("access_token", token);

  const res = await fetch(apiUrl.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as GraphPostRaw;
  if (!json?.id) return null;
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
): Promise<FacebookPostForImport> {
  let message = post.message?.trim() ?? "";
  let full_picture = post.full_picture?.trim() ?? "";
  const urls = [
    post.permalink_url?.trim(),
    permalinkForPost(post, pageId),
  ].filter((u): u is string => Boolean(u?.startsWith("http")));

  const uniqueUrls = [...new Set(urls)];
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
      if (message && full_picture) break;
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
  let current = normalizeGraphPostRaw(post as GraphPostRaw);

  const messageIsJunk = isFacebookJunkText(current.message?.trim() ?? "");
  const needsGraph =
    Boolean(token) &&
    (Boolean(options.importAll) ||
      !current.full_picture ||
      !current.message ||
      messageIsJunk);

  if (needsGraph && token) {
    const detailed = await fetchGraphPostById(post.id, token);
    if (detailed) {
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

  return enrichFromOpenGraph(
    {
      ...current,
      permalink_url: current.permalink_url ?? permalinkForPost(current, pageId),
    },
    pageId,
    stillNeedsOg,
  );
}

/** Limite URL couverture (PostgREST / affichage). */
export function sanitizeCoverUrl(url: string | undefined | null): string | null {
  const u = url?.trim();
  if (!u?.startsWith("http")) return null;
  return u.length > 2048 ? u.slice(0, 2048) : u;
}
