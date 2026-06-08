/**
 * Diagnostic import Facebook — affiches fbcdn, coquilles, dernière exécution.
 */

import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  isFacebookArticleCompleteOnSite,
  isFacebookArticleNeedsRepair,
} from "@/lib/facebook-import-filters";
import {
  countFbcdnCoversInDb,
  isFacebookCdnCoverUrl,
} from "@/lib/facebook-cover-persist";

export type FacebookImportStatus = {
  ok: boolean;
  fbcdnCoversInDb: number;
  incompleteArticles: number;
  shellArticles: number;
  samples: {
    slug: string;
    title: string;
    coverHost: string | null;
    issue: string;
    siteUrl: string;
  }[];
  hint: string;
};

export async function getFacebookImportStatus(
  sampleLimit = 8,
): Promise<FacebookImportStatus> {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.mooreanews.com";

  const fbcdnCoversInDb = await countFbcdnCoversInDb();

  const supabase = getAdminSupabase();
  if (!supabase) {
    return {
      ok: false,
      fbcdnCoversInDb,
      incompleteArticles: 0,
      shellArticles: 0,
      samples: [],
      hint: "Supabase non configuré — impossible de lire les articles.",
    };
  }

  const { data } = await supabase
    .from("articles")
    .select("slug, title, excerpt, body, cover_url, published_at")
    .like("slug", "mooreanews-fb-%")
    .order("published_at", { ascending: false })
    .limit(120);

  let incompleteArticles = 0;
  let shellArticles = 0;
  const samples: FacebookImportStatus["samples"] = [];

  for (const row of data ?? []) {
    const slug = row.slug ?? "";
    if (!slug) continue;

    const needsRepair = isFacebookArticleNeedsRepair({ ...row, slug });
    const complete = isFacebookArticleCompleteOnSite(row);
    if (!complete) incompleteArticles += 1;
    if (needsRepair && !complete) shellArticles += 1;

    if (samples.length >= sampleLimit) continue;

    let issue: string | null = null;
    if (isFacebookCdnCoverUrl(row.cover_url)) {
      issue = "cover_fbcdn_blocked_on_site";
    } else if (!row.cover_url?.trim() && needsRepair) {
      issue = "missing_cover";
    } else if (!complete) {
      issue = "incomplete_content";
    }

    if (issue) {
      let coverHost: string | null = null;
      try {
        coverHost = row.cover_url
          ? new URL(row.cover_url).hostname
          : null;
      } catch {
        coverHost = null;
      }
      samples.push({
        slug,
        title: (row.title ?? "").slice(0, 100),
        coverHost,
        issue,
        siteUrl: `${site}/actualites/${slug}`,
      });
    }
  }

  const ok = fbcdnCoversInDb === 0 && incompleteArticles === 0;
  let hint: string;
  if (fbcdnCoversInDb > 0) {
    hint =
      `${fbcdnCoversInDb} affiche(s) fbcdn en base — invisibles sur le site. ` +
      "Relancez /api/cron/facebook (plusieurs fois si besoin).";
  } else if (incompleteArticles > 0) {
    hint =
      `${incompleteArticles} article(s) Facebook incomplet(s). ` +
      "Le cron répare ~3 coquilles + 8 affiches par run.";
  } else {
    hint = "Import Facebook OK — aucune affiche fbcdn bloquée détectée.";
  }

  return {
    ok,
    fbcdnCoversInDb,
    incompleteArticles,
    shellArticles,
    samples,
    hint,
  };
}
