/**
 * Import Facebook → Événement, Annonce ou Actualité (texte + affiche).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import type { FacebookPageImportConfig } from "@/lib/facebook-article-import";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  announcementCategoryFromMessage,
  classifyFacebookPost,
  eventCategoryFromMessage,
  parseDateFromMessage,
  parseDistrictFromMessage,
  parseLocationFromMessage,
  parseTimeFromMessage,
  titleFromMessage,
} from "@/lib/facebook-post-parse";

export type FacebookContentImportResult = {
  eventsCreated: number;
  announcementsCreated: number;
  articlesCreated: number;
  skipped: number;
  errors: string[];
  createdEvents: { title: string; id: string; date: string }[];
  createdArticles: { title: string; slug: string }[];
  createdAnnouncements: { title: string; id: string }[];
};

function importEnabled(): boolean {
  return process.env.FACEBOOK_IMPORT_AS_ARTICLES === "true";
}

function publishedByDefault(): boolean {
  if (process.env.FACEBOOK_ARTICLES_PUBLISHED === "false") return false;
  return true;
}

function slugForPost(pageKey: string, postId: string): string {
  const safe = postId.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 80);
  return `${pageKey}-fb-${safe}`;
}

function buildBody(
  message: string,
  permalink: string,
  pageName: string,
): string {
  const text = message.trim();
  const footer = `\n\n---\n\nSource : [Publication Facebook — ${pageName}](${permalink})`;
  return text ? `${text}${footer}` : `Publication Facebook — ${pageName}.${footer}`;
}

function fallbackEventDate(createdTime?: string): string {
  if (createdTime) {
    const d = createdTime.slice(0, 10);
    if (d >= new Date().toISOString().slice(0, 10)) return d;
  }
  const next = new Date();
  next.setDate(next.getDate() + 7);
  return next.toISOString().slice(0, 10);
}

async function importAsEvent(
  post: FacebookPostForImport,
  config: FacebookPageImportConfig,
  published: boolean,
): Promise<{ ok: true; title: string; id: string; date: string } | { ok: false; reason: string }> {
  const supabase = getAdminSupabase();
  if (!supabase) return { ok: false, reason: "Supabase absent" };

  const permalink =
    post.permalink_url ??
    `${config.homepage.replace(/\/$/, "")}/posts/${post.id}`;
  const message = post.message?.trim() ?? "";

  const { data: existing } = await supabase
    .from("events")
    .select("id")
    .eq("url", permalink)
    .maybeSingle();

  if (existing) return { ok: false, reason: "duplicate" };

  const title =
    titleFromMessage(message, `${config.pageName} — événement`) ||
    `${config.pageName} — événement`;
  const date =
    parseDateFromMessage(message, post.created_time?.slice(0, 10)) ??
    fallbackEventDate(post.created_time);
  const startTime = parseTimeFromMessage(message);
  const district = parseDistrictFromMessage(message);
  const location = parseLocationFromMessage(message);
  const description = message || `Événement repéré sur ${config.pageName}.`;

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      description: buildBody(description, permalink, config.pageName),
      category: eventCategoryFromMessage(message),
      date,
      start_time: startTime,
      location,
      district,
      organizer: config.pageName,
      cover_url: post.full_picture?.trim() || null,
      url: permalink,
      published,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "insert failed" };
  }

  return { ok: true, title, id: data.id, date };
}

async function importAsAnnouncement(
  post: FacebookPostForImport,
  config: FacebookPageImportConfig,
  published: boolean,
): Promise<{ ok: true; title: string; id: string } | { ok: false; reason: string }> {
  const supabase = getAdminSupabase();
  if (!supabase) return { ok: false, reason: "Supabase absent" };

  const permalink =
    post.permalink_url ??
    `${config.homepage.replace(/\/$/, "")}/posts/${post.id}`;
  const message = post.message?.trim() ?? "";
  const marker = `fb-import:${post.id}`;

  const { data: existing } = await supabase
    .from("announcements")
    .select("id")
    .ilike("body", `%${marker}%`)
    .maybeSingle();

  if (existing) return { ok: false, reason: "duplicate" };

  const title = titleFromMessage(message, `${config.pageName} — annonce`);
  const body = `${buildBody(message || title, permalink, config.pageName)}\n\n${marker}`;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title,
      body,
      category: announcementCategoryFromMessage(message),
      district: parseDistrictFromMessage(message),
      cover_url: post.full_picture?.trim() || null,
      author: config.authorLabel,
      contact: config.pageName,
      published,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, reason: error?.message ?? "insert failed" };
  }

  return { ok: true, title, id: data.id };
}

async function importAsArticle(
  post: FacebookPostForImport,
  config: FacebookPageImportConfig,
  published: boolean,
): Promise<{ ok: true; title: string; slug: string } | { ok: false; reason: string }> {
  const supabase = getAdminSupabase();
  if (!supabase) return { ok: false, reason: "Supabase absent" };

  const permalink =
    post.permalink_url ??
    `${config.homepage.replace(/\/$/, "")}/posts/${post.id}`;
  const message = post.message?.trim() ?? "";
  const slug = slugForPost(config.pageKey, post.id);

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { ok: false, reason: "duplicate" };

  const title =
    titleFromMessage(message, `${config.pageName} — publication`) ||
    `${config.pageName} — publication`;

  const { error } = await supabase.from("articles").insert({
    slug,
    title,
    excerpt:
      message.slice(0, 280) ||
      `Publication repérée sur la page Facebook ${config.pageName}.`,
    body: buildBody(message, permalink, config.pageName),
    category: "actualites",
    tags: ["facebook-import", config.tag],
    cover_url: post.full_picture?.trim() || null,
    author: config.authorLabel,
    featured: false,
    published,
  });

  if (error) return { ok: false, reason: error.message };
  return { ok: true, title, slug };
}

/** Route chaque post vers Événement / Annonce / Actualité. */
export async function importFacebookPostsAsContent(
  posts: FacebookPostForImport[],
  config: FacebookPageImportConfig,
): Promise<FacebookContentImportResult> {
  const result: FacebookContentImportResult = {
    eventsCreated: 0,
    announcementsCreated: 0,
    articlesCreated: 0,
    skipped: 0,
    errors: [],
    createdEvents: [],
    createdArticles: [],
    createdAnnouncements: [],
  };

  if (!importEnabled()) return result;

  const published = publishedByDefault();

  for (const post of posts) {
    const message = post.message?.trim() ?? "";
    const hasImage = Boolean(post.full_picture?.trim());
    const kind = classifyFacebookPost(message, hasImage);

    if (kind === "event") {
      const r = await importAsEvent(post, config, published);
      if (r.ok) {
        result.eventsCreated += 1;
        result.createdEvents.push({
          title: r.title,
          id: r.id,
          date: r.date,
        });
      } else if (r.reason === "duplicate") {
        result.skipped += 1;
      } else {
        result.errors.push(`event ${post.id}: ${r.reason}`);
      }
      continue;
    }

    if (kind === "announcement") {
      const r = await importAsAnnouncement(post, config, published);
      if (r.ok) {
        result.announcementsCreated += 1;
        result.createdAnnouncements.push({ title: r.title, id: r.id });
      } else if (r.reason === "duplicate") {
        result.skipped += 1;
      } else {
        result.errors.push(`announcement ${post.id}: ${r.reason}`);
      }
      continue;
    }

    const r = await importAsArticle(post, config, published);
    if (r.ok) {
      result.articlesCreated += 1;
      result.createdArticles.push({ title: r.title, slug: r.slug });
    } else if (r.reason === "duplicate") {
      result.skipped += 1;
    } else {
      result.errors.push(`article ${post.id}: ${r.reason}`);
    }
  }

  return result;
}
