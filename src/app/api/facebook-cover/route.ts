/**
 * Résout l’affiche d’un article Facebook MooreaNews (Graph/OG → Supabase).
 * Utilisé en fallback quand cover_url est absent en base.
 */

import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  coverUrlForDatabase,
  persistFacebookCoverForPost,
  postIdFromMooreaNewsSlug,
} from "@/lib/facebook-cover-persist";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function noIndex(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  if (!slug.startsWith("mooreanews-fb-")) {
    return NextResponse.json({ error: "invalid_slug" }, { status: 400 });
  }

  const admin = getAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: "supabase_absent" }, { status: 503 });
  }

  const { data: row } = await admin
    .from("articles")
    .select("cover_url")
    .eq("slug", slug)
    .maybeSingle();

  const existing = row?.cover_url?.trim() ?? "";
  if (
    existing.startsWith("http") &&
    !existing.includes("fbcdn.net") &&
    !existing.includes("fbsbx.com")
  ) {
    return noIndex(NextResponse.redirect(existing, 302));
  }

  const postId = postIdFromMooreaNewsSlug(slug);
  const m = slug.match(/mooreanews-fb-(\d+)-(\d+)$/);
  const pageId = m?.[1] ?? "350029589936";
  const postPart = m?.[2] ?? "";

  const persist = await persistFacebookCoverForPost(
    {
      id: postId,
      full_picture: existing || null,
      permalink_url: `https://www.facebook.com/${pageId}/posts/${postPart}`,
    },
    slug,
    pageId,
  );
  const cover = coverUrlForDatabase(persist);
  if (!cover) {
    return NextResponse.json(
      { error: "cover_unavailable", reason: persist.reason },
      { status: 404 },
    );
  }

  await admin
    .from("articles")
    .update({ cover_url: cover, updated_at: new Date().toISOString() })
    .eq("slug", slug);

  return noIndex(NextResponse.redirect(cover, 302));
}
