import { NextResponse } from "next/server";
import { listExternalArticles } from "@/lib/aggregator";
import { RSS_SOURCES } from "@/lib/rss-sources";
import { FACEBOOK_WATCH_URLS } from "@/lib/watch-sources";

export const dynamic = "force-dynamic";

/**
 * Diagnostic veille (sans secrets). Ouvrir :
 * https://www.mooreanews.com/api/watch/status
 */
export async function GET() {
  const articles = await listExternalArticles(5);
  const count = articles?.length ?? 0;

  const env = {
    supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnon: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    cronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    facebookPageToken: Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim()),
    facebookUserToken: Boolean(process.env.FACEBOOK_USER_ACCESS_TOKEN?.trim()),
  };

  const ready =
    env.supabaseServiceRole &&
    env.supabaseUrl &&
    articles !== null;

  return NextResponse.json({
    ready,
    hint: ready
      ? "Lancez /api/cron/aggregate?secret=VOTRE_CRON_SECRET ou Admin → Agréger maintenant"
      : "Ajoutez SUPABASE_SERVICE_ROLE_KEY sur Vercel puis redéployez",
    config: env,
    rssSources: RSS_SOURCES.length,
    facebookLinksConfigured: FACEBOOK_WATCH_URLS.length,
    externalArticlesVisible: count,
    sampleTitles: articles?.map((a) => a.title) ?? [],
    expectedCronSources: [
      ...RSS_SOURCES.map((s) => s.id),
      "facebook-watch",
      "facebook-pages",
    ],
  });
}
