import { createHash } from "node:crypto";

/** Identifiant stable pour upsert external_articles (Facebook). */
export function externalIdFromFacebookUrl(url: string): string {
  const permalink = url.match(/permalink\/(\d+)/)?.[1];
  if (permalink) return `fb-permalink-${permalink}`;
  const postId = url.match(/\/posts\/(\d+)/)?.[1];
  if (postId) return `fb-post-${postId}`;
  const fbid = url.match(/fbid=(\d+)/)?.[1];
  if (fbid) return `fb-photo-${fbid}`;
  return `fb-${createHash("sha256").update(url).digest("hex").slice(0, 24)}`;
}

export function isFacebookUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.includes("facebook.com") || host.includes("fb.com");
  } catch {
    return false;
  }
}
