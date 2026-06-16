/**
 * Évite de republier le même article sur le canal Telegram @MooreaNews.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

type ChannelPostRow = { slug: string; posted_at?: string };

/** Table absente des types Supabase générés — requêtes typées localement. */
function channelPostsTable(supabase: NonNullable<ReturnType<typeof getAdminSupabase>>) {
  return supabase.from("telegram_channel_posts" as "articles") as unknown as {
    select: (cols: string) => {
      in: (
        col: string,
        vals: string[],
      ) => Promise<{
        data: Pick<ChannelPostRow, "slug">[] | null;
        error: { message: string } | null;
      }>;
    };
    upsert: (
      row: ChannelPostRow,
      opts: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
}

export async function filterNotYetOnTelegramChannel<
  T extends { slug: string },
>(articles: T[]): Promise<T[]> {
  if (articles.length === 0) return [];
  const supabase = getAdminSupabase();
  if (!supabase) return articles;

  const slugs = [...new Set(articles.map((a) => a.slug).filter(Boolean))];
  const { data, error } = await channelPostsTable(supabase)
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
  const { error } = await channelPostsTable(supabase).upsert(
    { slug: slug.trim(), posted_at: new Date().toISOString() },
    { onConflict: "slug" },
  );
  if (error) {
    console.warn("[telegram channel dedup] mark", slug, error.message);
  }
}
