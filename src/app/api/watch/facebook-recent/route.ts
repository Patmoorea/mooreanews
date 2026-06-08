import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { listMooreaNewsGraphPosts, listMooreaNewsUploadedPhotos } from "@/lib/facebook-watch";
import { shouldImportFacebookPost, isFacebookArticleCompleteOnSite } from "@/lib/facebook-import-filters";
import { getAdminSupabase } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function slugForPostId(postId: string): string {
  const safe = postId.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 80);
  return `mooreanews-fb-${safe}`;
}

/** GET /api/watch/facebook-recent?secret=... */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const posts = await listMooreaNewsGraphPosts();
  const supabase = getAdminSupabase();
  const articlesBySlug = new Map<
    string,
    {
      title: string;
      excerpt: string | null;
      body: string;
      cover_url: string | null;
    }
  >();
  if (supabase) {
    const { data } = await supabase
      .from("articles")
      .select("slug, title, excerpt, body, cover_url")
      .like("slug", "mooreanews-fb-%");
    for (const row of data ?? []) {
      if (row.slug) {
        articlesBySlug.set(row.slug, {
          title: row.title,
          excerpt: row.excerpt,
          body: row.body,
          cover_url: row.cover_url,
        });
      }
    }
  }

  const url = new URL(req.url);
  const fbidSearch = url.searchParams.get("fbid")?.trim();
  const textSearch = url.searchParams.get("q")?.trim().toLowerCase();
  const daySearch = url.searchParams.get("day")?.trim();
  const withUploaded = url.searchParams.get("uploaded") === "1";

  const recent = posts.slice(0, 20).map((post) => {
    const message = post.message?.trim() ?? "";
    const slug = slugForPostId(post.id);
    const numericId = post.id.split("_").pop() ?? post.id;
    const altSlug = `mooreanews-fb-350029589936-${numericId}`;
    const article = articlesBySlug.get(slug) ?? articlesBySlug.get(altSlug);
    const onSite = Boolean(article);
    const completeOnSite = article
      ? isFacebookArticleCompleteOnSite(article)
      : false;
    const hasCoverOnSite = Boolean(article?.cover_url?.trim());
    const freshness = shouldImportFacebookPost(
      message,
      post.created_time,
      post,
      { importAllFeedPosts: true },
    );
    return {
      id: post.id,
      created_time: post.created_time,
      tahiti: post.created_time
        ? new Date(post.created_time).toLocaleString("fr-FR", {
            timeZone: "Pacific/Tahiti",
            dateStyle: "short",
            timeStyle: "short",
          })
        : null,
      onSite,
      completeOnSite,
      hasCoverOnSite,
      siteTitle: article?.title?.slice(0, 120) ?? null,
      slug: altSlug,
      siteUrl: onSite
        ? `https://www.mooreanews.com/actualites/${altSlug}`
        : null,
      importOk: freshness.ok,
      skipReason: freshness.ok ? null : freshness.reason,
      hasMessage: message.length > 0,
      hasImage: Boolean(post.full_picture?.trim()),
      messagePreview: message.slice(0, 100) || null,
      permalink: post.permalink_url,
    };
  });

  let fbidMatch: Record<string, unknown> | null = null;
  if (fbidSearch && /^\d+$/.test(fbidSearch)) {
    const post = posts.find(
      (p) =>
        p.id === fbidSearch ||
        p.id.endsWith(`_${fbidSearch}`) ||
        p.permalink_url?.includes(`fbid=${fbidSearch}`),
    );
    if (post) {
      const message = post.message?.trim() ?? "";
      const numericId = post.id.split("_").pop() ?? post.id;
      const altSlug = `mooreanews-fb-350029589936-${numericId}`;
      const article = articlesBySlug.get(slugForPostId(post.id)) ?? articlesBySlug.get(altSlug);
      fbidMatch = {
        id: post.id,
        created_time: post.created_time,
        messagePreview: message.slice(0, 200) || null,
        hasImage: Boolean(post.full_picture?.trim()),
        permalink: post.permalink_url,
        onSite: Boolean(article),
        slug: altSlug,
        siteUrl: article
          ? `https://www.mooreanews.com/actualites/${altSlug}`
          : null,
      };
    }
  }

  const textMatches =
    textSearch && textSearch.length >= 3
      ? posts
          .filter((p) => {
            const blob = `${p.message ?? ""} ${p.permalink_url ?? ""} ${p.id}`.toLowerCase();
            return blob.includes(textSearch);
          })
          .slice(0, 10)
          .map((post) => ({
            id: post.id,
            created_time: post.created_time,
            messagePreview: post.message?.slice(0, 160) ?? null,
            permalink: post.permalink_url,
            hasImage: Boolean(post.full_picture?.trim()),
          }))
      : undefined;

  const dayMatches =
    daySearch && /^\d{4}-\d{2}-\d{2}$/.test(daySearch)
      ? posts
          .filter((p) => p.created_time?.startsWith(daySearch))
          .slice(0, 30)
          .map((post) => ({
            id: post.id,
            created_time: post.created_time,
            tahiti: post.created_time
              ? new Date(post.created_time).toLocaleString("fr-FR", {
                  timeZone: "Pacific/Tahiti",
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : null,
            hasImage: Boolean(post.full_picture?.trim()),
            messagePreview: post.message?.slice(0, 120) || null,
            permalink: post.permalink_url,
          }))
      : undefined;

  const uploadedPhotos = withUploaded
    ? await listMooreaNewsUploadedPhotos(35)
    : undefined;

  return NextResponse.json({
    ok: true,
    fetched: posts.length,
    fbidSearch: fbidSearch || undefined,
    fbidMatch,
    textSearch: textSearch || undefined,
    textMatches,
    daySearch: daySearch || undefined,
    dayMatches,
    uploadedPhotos,
    missingOnSite: recent.filter((p) => !p.onSite),
    incompleteOnSite: recent.filter((p) => p.onSite && !p.completeOnSite),
    recent,
  });
}
