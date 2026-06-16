/**
 * Types partagés pour l’import Facebook (Graph API + OG).
 */

export type FacebookPostForImport = {
  id: string;
  message?: string;
  permalink_url?: string;
  created_time?: string;
  full_picture?: string;
};

export type FacebookArticleImportResult = {
  created: number;
  skipped: number;
  errors: string[];
  createdArticles: { title: string; slug: string }[];
};

export type FacebookPageImportConfig = {
  pageKey: string;
  pageName: string;
  homepage: string;
  authorLabel: string;
  tag: string;
  /** Alertes ferry auto : uniquement posts page officielle (pas liens OG veille). */
  allowFerryAlerts?: boolean;
  /** MooreaNews : publier tout le fil (affiche seule, sans légende, etc.). */
  importAllFeedPosts?: boolean;
  /** Jeton page Meta pour enrichissement post-by-id. */
  pageAccessToken?: string;
  graphPageId?: string;
  /** Cron Vercel : réparations légères (persist cover sans Graph/OG). */
  cronLight?: boolean;
  /** Veille sync : uniquement posts absents du site. */
  newPostsOnly?: boolean;
  /** Nombre max de nouveaux posts par run (veille Hobby). */
  newPostsLimit?: number;
  /** Pas de réparations (veille sync ~60 s). */
  skipRepairs?: boolean;
  /** Uniquement réparer les articles MooreaNews incomplets. */
  repairOnly?: boolean;
  repairLimit?: number;
};

/** @deprecated Utiliser importFacebookPostsAsContent */
export async function importFacebookPagePostsAsArticles(
  posts: FacebookPostForImport[],
  config: FacebookPageImportConfig,
): Promise<FacebookArticleImportResult> {
  const { importFacebookPostsAsContent } = await import(
    "@/lib/facebook-content-import"
  );
  const r = await importFacebookPostsAsContent(posts, config);
  return {
    created: r.articlesCreated,
    skipped: r.skipped,
    errors: r.errors,
    createdArticles: r.createdArticles,
  };
}

/** @deprecated Utiliser importFacebookPostsAsContent */
export const importCommuneFacebookPostsAsArticles = (
  posts: FacebookPostForImport[],
  pageName: string,
) =>
  importFacebookPagePostsAsArticles(posts, {
    pageKey: "commune",
    pageName,
    homepage: "https://www.facebook.com/CommuneMooreaMaiao",
    authorLabel: "Commune de Moorea-Maiao (Facebook)",
    tag: "commune-moorea",
  });
