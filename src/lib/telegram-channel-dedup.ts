/**
 * Évite de republier le même article sur le canal Telegram @MooreaNews.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

export async function filterNotYetOnTelegramChannel<
  T extends { slug: string },
>(articles: T[]): Promise<T[]> {
  if (articles.length === 0) return [];
  const supabase = getAdminSupabase();
  if (!supabase) return articles;

  const slugs = [...new Set(articles.map((a) => a.slug).filter(Boolean))];
  const { data, error } = await supabase
    .from("telegram_channel_posts")
    .select("slug")
    .in("slug", slugs);

  if (error) {
    console.warn("[telegram channel dedup]", error.message);
    return articles;
  }

  const posted = new Set((data ?? []).map((r) => r.slug));
  return articles.filter((a) => !posted.has(a.slug));
}

export async function markPostedOnTelegramChannel(slug: string): Promise<void> {
  const supabase = getAdminSupabase();
  if (!supabase || !slug.trim()) return;
  const { error } = await supabase.from("telegram_channel_posts").upsert(
    { slug: slug.trim(), posted_at: new Date().toISOString() },
    { onConflict: "slug" },
  );
  if (error) {
    console.warn("[telegram channel dedup] mark", slug, error.message);
  }
}
