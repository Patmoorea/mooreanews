/**
 * Import Facebook → Événement, Annonce ou Actualité (texte + affiche).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import type { FacebookPageImportConfig } from "@/lib/facebook-article-import";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  facebookPostHasPublishableContent,
  isFacebookJunkText,
  shouldImportFacebookPost,
} from "@/lib/facebook-import-filters";
import { fetchOpenGraph } from "@/lib/open-graph";
import { cleanImportedText } from "@/lib/html-entities";
import {
  announcementCategoryFromMessage,
  eventCategoryFromMessage,
  parseDateFromMessage,
  parseDistrictFromMessage,
  parseLocationFromMessage,
  parseTimeFromMessage,
  titleFromMessage,
  hasRelativeWeekdayDate,
} from "@/lib/facebook-post-parse";
import { humanEventTitle } from "@/lib/event-title";
import {
  tryImportFacebookAlert,
  tryImportFacebookMeteoAlert,
} from "@/lib/facebook-alert-import";
import { routeFacebookImport } from "@/lib/facebook-content-route";

export type FacebookContentImportResult = {
  eventsCreated: number;
  announcementsCreated: number;
  articlesCreated: number;
  alertsCreated: number;
  skipped: number;
  skippedStale: number;
  errors: string[];
  createdEvents: { title: string; id: string; date: string }[];
  createdArticles: { title: string; slug: string }[];
  createdAnnouncements: { title: string; id: string }[];
  createdAlerts: string[];
};

function importEnabled(): boolean {
  return process.env.FACEBOOK_IMPORT_AS_ARTICLES === "true";
}

function eventsPublishedByDefault(): boolean {
  return process.env.FACEBOOK_EVENTS_PUBLISHED === "true";
}

/** Brouillon par défaut — publier seulement si FACEBOOK_ARTICLES_PUBLISHED=true sur Vercel. */
function publishedByDefault(): boolean {
  return process.env.FACEBOOK_ARTICLES_PUBLISHED === "true";
}

async function enrichPostFromOpenGraph(
  post: FacebookPostForImport,
): Promise<FacebookPostForImport> {
  let message = cleanImportedText(post.message?.trim() ?? "");
  let full_picture = post.full_picture?.trim() ?? "";
  const url = post.permalink_url?.trim();

  if (url) {
    try {
      const og = await fetchOpenGraph(url);
      if (og) {
        const ogText = cleanImportedText(
          og.description?.trim() || og.title?.trim() || "",
        );
        if (
          ogText &&
          !isFacebookJunkText(ogText) &&
          (ogText.length > message.length || !message)
        ) {
          message = ogText;
        }
        const ogImage = og.imageUrl?.trim();
        if (ogImage?.startsWith("http")) {
          full_picture = ogImage;
        }
      }
    } catch {
      // silencieux
    }
  }

  return {
    ...post,
    message: message || undefined,
    full_picture: full_picture || undefined,
  };
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

  const title = humanEventTitle(
    titleFromMessage(message, `${config.pageName} — événement`),
    `${config.pageName} — événement`,
  );
  const refDay = post.created_time?.slice(0, 10);
  const date =
    parseDateFromMessage(message, refDay) ?? fallbackEventDate(post.created_time);
  const today = new Date().toISOString().slice(0, 10);
  if (hasRelativeWeekdayDate(message) && date < today) {
    return { ok: false, reason: "past_relative_event" };
  }
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
  publishedAt: string,
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
    published_at: publishedAt,
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
    alertsCreated: 0,
    skipped: 0,
    skippedStale: 0,
    errors: [],
    createdEvents: [],
    createdArticles: [],
    createdAnnouncements: [],
    createdAlerts: [],
  };

  if (!importEnabled()) return result;

  const published = publishedByDefault();

  for (const raw of posts) {
    const post = await enrichPostFromOpenGraph({
      ...raw,
      message: raw.message ? cleanImportedText(raw.message) : raw.message,
    });
    const message = post.message?.trim() ?? "";
    const freshness = shouldImportFacebookPost(
      message,
      post.created_time,
      post,
    );
    if (!freshness.ok) {
      result.skippedStale += 1;
      continue;
    }
    const publishedAt = freshness.publishedAt;
    const hasImage = Boolean(post.full_picture?.trim());
    const target = routeFacebookImport(message, {
      sourceLabel: config.pageName,
      hasImage,
    });

    if (target === "skip") {
      result.skippedStale += 1;
      continue;
    }

    if (target === "meteo_alert") {
      const alert = await tryImportFacebookMeteoAlert({
        message,
        permalink: post.permalink_url,
        imageUrl: post.full_picture,
        sourceLabel: config.pageName,
        fallbackTitle: `${config.pageName} — vigilance météo`,
      });
      if (alert.created && alert.title) {
        result.alertsCreated += 1;
        result.createdAlerts.push(alert.title);
        continue;
      }
    }

    if (target === "ferry_alert" && config.allowFerryAlerts !== false) {
      const alert = await tryImportFacebookAlert({
        message,
        permalink: post.permalink_url,
        imageUrl: post.full_picture,
        fallbackTitle: `${config.pageName} — info ferry`,
      });
      if (alert.created && alert.title) {
        result.alertsCreated += 1;
        result.createdAlerts.push(alert.title);
        continue;
      }
    }

    if (target === "event") {
      const r = await importAsEvent(post, config, eventsPublishedByDefault());
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

    if (target === "announcement") {
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

    const r = await importAsArticle(post, config, published, publishedAt);
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
