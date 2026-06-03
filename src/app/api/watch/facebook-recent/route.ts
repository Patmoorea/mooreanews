import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { listMooreaNewsGraphPosts } from "@/lib/facebook-watch";
import { shouldImportFacebookPost } from "@/lib/facebook-import-filters";
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
  const slugs = new Set<string>();
  if (supabase) {
    const { data } = await supabase
      .from("articles")
      .select("slug")
      .like("slug", "mooreanews-fb-%");
    for (const row of data ?? []) {
      if (row.slug) slugs.add(row.slug);
    }
  }

  const recent = posts.slice(0, 20).map((post) => {
    const message = post.message?.trim() ?? "";
    const slug = slugForPostId(post.id);
    const numericId = post.id.split("_").pop() ?? post.id;
    const altSlug = `mooreanews-fb-350029589936-${numericId}`;
    const onSite = slugs.has(slug) || slugs.has(altSlug);
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

  return NextResponse.json({
    ok: true,
    fetched: posts.length,
    missingOnSite: recent.filter((p) => !p.onSite),
    recent,
  });
}
