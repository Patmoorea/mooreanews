/**
 * Import Facebook → Événement, Annonce ou Actualité (texte + affiche).
 */

import type { FacebookPostForImport } from "@/lib/facebook-article-import";
import type { FacebookPageImportConfig } from "@/lib/facebook-article-import";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  isFacebookArticleNeedsRepair,
  isFacebookCoverNeedsPersistOnly,
  isFacebookJunkText,
  isRecentFacebookPost,
  facebookCronMaxRepairsPerRun,
  publishedAtFromFacebookPost,
  shouldImportFacebookPost,
} from "@/lib/facebook-import-filters";
import {
  enrichFacebookPostForImport,
  permalinkForPost,
} from "@/lib/facebook-post-enrich";
import {
  coverPersistUserMessage,
  coverUrlForDatabase,
  isFacebookCdnCoverUrl,
  persistFacebookCoverUrl,
  repairPendingFbcdnCoversFromDb,
} from "@/lib/facebook-cover-persist";
import { hideExternalArticlesForArticleSlug } from "@/lib/facebook-external-sync";
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
  articlesRepaired?: number;
  coversPersisted?: number;
  coversFailed?: number;
  warnings: string[];
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

async function enrichPost(
  post: FacebookPostForImport,
  config: FacebookPageImportConfig,
): Promise<FacebookPostForImport> {
  const cleaned = {
    ...post,
    message: post.message ? cleanImportedText(post.message) : post.message,
  };
  if (!config.importAllFeedPosts) {
    return enrichFacebookPostForImport(cleaned, config.pageAccessToken, {
      pageId: config.graphPageId,
      importAll: false,
    });
  }
  return enrichFacebookPostForImport(cleaned, config.pageAccessToken, {
    pageId: config.graphPageId ?? "350029589936",
    importAll: true,
  });
}

function articleTitleFromPost(
  message: string,
  config: FacebookPageImportConfig,
  hasImage: boolean,
  publishedAt: string,
): string {
  const clean = message.trim();
  if (clean && !isFacebookJunkText(clean)) {
    const fromMsg = titleFromMessage(clean, "");
    if (fromMsg && !isFacebookJunkText(fromMsg)) return fromMsg;
  }
  const timeLabel = tahitiTimeLabel(publishedAt);
  return hasImage
    ? `${config.pageName} — affiche · ${timeLabel}`
    : `${config.pageName} — publication · ${timeLabel}`;
}

function tahitiTimeLabel(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
): Promise<
  | { ok: true; title: string; slug: string; coverWarning?: string }
  | { ok: false; reason: string }
> {
  const supabase = getAdminSupabase();
  if (!supabase) return { ok: false, reason: "Supabase absent" };

  const permalink = permalinkForPost(
    { id: post.id, permalink_url: post.permalink_url },
    config.graphPageId ?? "350029589936",
  );
  const message = post.message?.trim() ?? "";
  const slug = slugForPost(config.pageKey, post.id);

  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return { ok: false, reason: "duplicate" };

  const hasImage = Boolean(post.full_picture?.trim());
  const timeLabel = tahitiTimeLabel(publishedAt);
  const title = articleTitleFromPost(message, config, hasImage, publishedAt);

  const persist = await persistFacebookCoverUrl(post.full_picture, post.id);
  const cover = coverUrlForDatabase(persist);

  const { data, error } = await supabase
    .from("articles")
    .insert({
      slug,
      title: title.slice(0, 500),
      excerpt:
        message.slice(0, 280) ||
        `Publication Facebook ${config.pageName} · ${timeLabel}`,
      body: buildBody(message, permalink, config.pageName),
      category: "actualites",
      tags: ["facebook-import", config.tag],
      cover_url: cover,
      author: config.authorLabel,
      featured: false,
      published,
      published_at: publishedAt,
    })
    .select("slug")
    .single();

  if (error || !data) return { ok: false, reason: error?.message ?? "insert failed" };
  await hideExternalArticlesForArticleSlug(slug);
  if (post.full_picture?.trim() && !cover) {
    return {
      ok: true,
      title,
      slug: data.slug,
      coverWarning: coverPersistUserMessage(data.slug, persist.reason),
    };
  }
  return { ok: true, title, slug: data.slug };
}

async function repairFacebookArticle(
  articleId: string,
  slug: string,
  post: FacebookPostForImport,
  config: FacebookPageImportConfig,
  publishedAt: string,
  existingCoverUrl?: string | null,
): Promise<
  | { ok: true; title: string; slug: string; coverWarning?: string }
  | { ok: false; reason: string }
> {
  const supabase = getAdminSupabase();
  if (!supabase) return { ok: false, reason: "Supabase absent" };

  const permalink = permalinkForPost(
    { id: post.id, permalink_url: post.permalink_url },
    config.graphPageId ?? "350029589936",
  );
  const message = post.message?.trim() ?? "";
  const hasImage = Boolean(post.full_picture?.trim());
  const title = articleTitleFromPost(message, config, hasImage, publishedAt);
  const timeLabel = tahitiTimeLabel(publishedAt);
  const persist = await persistFacebookCoverUrl(
    post.full_picture ?? existingCoverUrl ?? undefined,
    post.id,
  );
  const cover = coverUrlForDatabase(persist);

  const patch: {
    title: string;
    excerpt: string;
    body: string;
    updated_at: string;
    cover_url?: string | null;
  } = {
    title: title.slice(0, 500),
    excerpt:
      message.slice(0, 280) ||
      `Publication Facebook ${config.pageName} · ${timeLabel}`,
    body: buildBody(message, permalink, config.pageName),
    updated_at: new Date().toISOString(),
  };
  if (cover) patch.cover_url = cover;
  else if (isFacebookCdnCoverUrl(existingCoverUrl)) patch.cover_url = null;

  const { error } = await supabase
    .from("articles")
    .update(patch)
    .eq("id", articleId);

  if (error) return { ok: false, reason: error.message };
  await hideExternalArticlesForArticleSlug(slug);
  if (
    (post.full_picture?.trim() || existingCoverUrl?.trim()) &&
    !cover
  ) {
    return {
      ok: true,
      title,
      slug,
      coverWarning: coverPersistUserMessage(slug, persist.reason),
    };
  }
  return { ok: true, title, slug };
}

/** Recopie fbcdn → Supabase sans enrichissement Graph/OG (cron rapide). */
async function repairFacebookCoverOnly(
  articleId: string,
  slug: string,
  postId: string,
  existingCoverUrl: string,
): Promise<{ ok: true; slug: string } | { ok: false; reason: string }> {
  const supabase = getAdminSupabase();
  if (!supabase) return { ok: false, reason: "Supabase absent" };

  const persist = await persistFacebookCoverUrl(existingCoverUrl, postId);
  const cover = coverUrlForDatabase(persist);
  if (!cover) {
    return { ok: false, reason: persist.reason };
  }

  const { error } = await supabase
    .from("articles")
    .update({
      cover_url: cover,
      updated_at: new Date().toISOString(),
    })
    .eq("id", articleId);

  if (error) return { ok: false, reason: error.message };
  await hideExternalArticlesForArticleSlug(slug);
  return { ok: true, slug };
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
    warnings: [],
  };

  if (!importEnabled()) return result;

  const published = publishedByDefault();

  type ExistingRow = {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    body: string;
    cover_url: string | null;
  };

  const existingBySlug = new Map<string, ExistingRow>();
  if (config.importAllFeedPosts) {
    const supabase = getAdminSupabase();
    if (supabase) {
      const batchSlugs = posts.map((raw) => slugForPost(config.pageKey, raw.id));
      let query = supabase
        .from("articles")
        .select("id, slug, title, excerpt, body, cover_url");
      if (config.cronLight && batchSlugs.length > 0) {
        query = query.in("slug", batchSlugs);
      } else {
        query = query.like("slug", `${config.pageKey}-fb-%`);
      }
      const { data } = await query;
      for (const row of data ?? []) {
        if (row.slug) existingBySlug.set(row.slug, row);
      }
    }
  }

  let repairsThisRun = 0;
  let coverPersistsThisRun = 0;
  const maxFullRepairs = config.cronLight
    ? 3
    : config.importAllFeedPosts
      ? facebookCronMaxRepairsPerRun()
      : posts.length;
  const maxCoverPersists = config.cronLight ? 8 : 40;

  for (const raw of posts) {
    const slug = slugForPost(config.pageKey, raw.id);
    const filterOpts = config.importAllFeedPosts
      ? { importAllFeedPosts: true as const }
      : undefined;

    if (config.importAllFeedPosts && !isRecentFacebookPost(raw.created_time)) {
      result.skippedStale += 1;
      continue;
    }

    if (config.importAllFeedPosts) {
      const existing = existingBySlug.get(slug);

      if (existing && !isFacebookArticleNeedsRepair({ ...existing, slug })) {
        result.skipped += 1;
        continue;
      }

      if (existing && isFacebookArticleNeedsRepair({ ...existing, slug })) {
        if (isFacebookCoverNeedsPersistOnly({ ...existing, slug })) {
          if (coverPersistsThisRun >= maxCoverPersists) {
            result.skipped += 1;
            continue;
          }
          const r = await repairFacebookCoverOnly(
            existing.id,
            slug,
            raw.id,
            existing.cover_url ?? "",
          );
          if (r.ok) {
            result.articlesRepaired = (result.articlesRepaired ?? 0) + 1;
            result.coversPersisted = (result.coversPersisted ?? 0) + 1;
            result.createdArticles.push({
              title: existing.title,
              slug: r.slug,
            });
            coverPersistsThisRun += 1;
          } else {
            result.coversFailed = (result.coversFailed ?? 0) + 1;
            result.warnings.push(
              coverPersistUserMessage(slug, r.reason),
            );
          }
          continue;
        }

        if (repairsThisRun >= maxFullRepairs) {
          result.skipped += 1;
          continue;
        }
        const post = await enrichPost(raw, config);
        const freshness = shouldImportFacebookPost(
          post.message?.trim() ?? "",
          post.created_time,
          post,
          filterOpts,
        );
        if (!freshness.ok) {
          result.skippedStale += 1;
          continue;
        }
        const r = await repairFacebookArticle(
          existing.id,
          slug,
          post,
          config,
          freshness.publishedAt,
          existing.cover_url,
        );
        if (r.ok) {
          result.articlesRepaired = (result.articlesRepaired ?? 0) + 1;
          result.createdArticles.push({ title: r.title, slug: r.slug });
          if ("coverWarning" in r && r.coverWarning) {
            result.warnings.push(r.coverWarning);
            result.coversFailed = (result.coversFailed ?? 0) + 1;
          } else if (post.full_picture?.trim()) {
            result.coversPersisted = (result.coversPersisted ?? 0) + 1;
          }
          repairsThisRun += 1;
        } else {
          result.errors.push(`repair ${post.id}: ${r.reason}`);
        }
        continue;
      }
    }

    const post = await enrichPost(raw, config);
    const message = post.message?.trim() ?? "";
    const freshness = shouldImportFacebookPost(
      message,
      post.created_time,
      post,
      filterOpts,
    );
    if (!freshness.ok) {
      result.skippedStale += 1;
      continue;
    }

    if (config.importAllFeedPosts) {
      const r = await importAsArticle(
        post,
        config,
        published,
        freshness.publishedAt,
      );
      if (r.ok) {
        result.articlesCreated += 1;
        result.createdArticles.push({ title: r.title, slug: r.slug });
        if ("coverWarning" in r && r.coverWarning) {
          result.warnings.push(r.coverWarning);
          result.coversFailed = (result.coversFailed ?? 0) + 1;
        } else if (post.full_picture?.trim()) {
          result.coversPersisted = (result.coversPersisted ?? 0) + 1;
        }
      } else if (r.reason === "duplicate") {
        result.skipped += 1;
      } else {
        result.errors.push(`article ${post.id}: ${r.reason}`);
      }
      continue;
    }

    const hasImage = Boolean(post.full_picture?.trim());
    const target = routeFacebookImport(message, {
      sourceLabel: config.pageName,
      hasImage,
      importAllFeedPosts: config.importAllFeedPosts,
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

    const r = await importAsArticle(post, config, published, freshness.publishedAt);
    if (r.ok) {
      result.articlesCreated += 1;
      result.createdArticles.push({ title: r.title, slug: r.slug });
      if ("coverWarning" in r && r.coverWarning) {
        result.warnings.push(r.coverWarning);
        result.coversFailed = (result.coversFailed ?? 0) + 1;
      } else if (post.full_picture?.trim()) {
        result.coversPersisted = (result.coversPersisted ?? 0) + 1;
      }
    } else if (r.reason === "duplicate") {
      result.skipped += 1;
    } else {
      result.errors.push(`article ${post.id}: ${r.reason}`);
    }
  }

  if (config.cronLight && config.importAllFeedPosts) {
    const queue = await repairPendingFbcdnCoversFromDb(maxCoverPersists);
    result.articlesRepaired =
      (result.articlesRepaired ?? 0) + queue.repaired;
    result.coversPersisted =
      (result.coversPersisted ?? 0) + queue.repaired;
    result.coversFailed = (result.coversFailed ?? 0) + queue.failed;
    result.warnings.push(...queue.warnings);
    result.errors.push(...queue.errors);
  }

  return result;
}
