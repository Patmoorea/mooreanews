/**
 * Sources « veille web » : liens Facebook à sonder, pages Meta optionnelles.
 * Complète les flux RSS (aggregator.ts).
 */

export type FacebookPageWatch = {
  id: string;
  pageId: string;
  name: string;
  homepage: string;
  /** Si true : pas d’erreur cron si jeton Meta absent pour cette page. */
  optional?: boolean;
};

/** Liens importants à re-vérifier à chaque passage du cron (Open Graph). */
export const FACEBOOK_WATCH_URLS: { url: string; label: string }[] = [
  {
    url: "https://www.facebook.com/CommuneMooreaMaiao",
    label: "Commune de Moorea-Maiao (page)",
  },
  {
    url: "https://www.facebook.com/groups/461940821326616/",
    label: "Groupe MOOREA Qui sait quoi ???",
  },
  {
    url: "https://www.facebook.com/photo?fbid=1291881963133173&set=a.396025476052164",
    label: "Commune — publication photo",
  },
  {
    url: "https://www.facebook.com/groups/461940821326616/permalink/2169618270558854/",
    label: "Groupe — publication récente",
  },
  {
    url: "https://www.facebook.com/groups/461940821326616/permalink/2170011110519570/",
    label: "Groupe — Tamure Va'a Marathon",
  },
  {
    url: "https://www.facebook.com/groups/461940821326616/permalink/2169927593861255/",
    label: "Groupe — Les Délices de Misstinguette",
  },
];

/** Pages Facebook suivies via Graph API (jeton page ou user → /me/accounts). */
export const FACEBOOK_PAGE_WATCHES: FacebookPageWatch[] = [
  {
    id: "moorea-news",
    pageId: "350029589936",
    name: "MooreaNews",
    homepage: "https://www.facebook.com/MooreaNews",
  },
  {
    id: "commune-moorea",
    pageId: "CommuneMooreaMaiao",
    name: "Commune de Moorea-Maiao",
    homepage: "https://www.facebook.com/CommuneMooreaMaiao",
    optional: true,
  },
];

export function extraFacebookWatchUrlsFromEnv(): string[] {
  const raw = process.env.FACEBOOK_WATCH_URLS ?? "";
  return raw
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter((u) => u.includes("facebook.com"));
}

export function allFacebookWatchUrls(): string[] {
  const fromConfig = FACEBOOK_WATCH_URLS.map((w) => w.url);
  const extra = extraFacebookWatchUrlsFromEnv();
  return [...new Set([...fromConfig, ...extra])];
}

/** Pages / sites Moorea à sonder (Open Graph à chaque collecte). */
export const WEB_WATCH_URLS: { url: string; label: string }[] = [
  {
    url: "https://www.commune-moorea.net/",
    label: "Commune de Moorea-Maiao (site officiel)",
  },
  {
    url: "https://www.commune-moorea.net/blog/",
    label: "Commune — actualités",
  },
  {
    url: "https://moorea.life/",
    label: "Moorea.life — agenda & annuaire",
  },
  {
    url: "https://www.tahiti-infos.com/",
    label: "Tahiti Infos (accueil)",
  },
  {
    url: "https://la1ere.francetvinfo.fr/polynesie/",
    label: "Polynésie la 1ère",
  },
  {
    url: "https://www.edt.pf/",
    label: "EDT — électricité Polynésie",
  },
  {
    url: "https://www.tntv.pf/",
    label: "TNTV — télévision locale",
  },
];

export function extraWebWatchUrlsFromEnv(): string[] {
  const raw = process.env.WEB_WATCH_URLS ?? "";
  return raw
    .split(/[\n,]/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"));
}

export function allWebWatchUrls(): string[] {
  const extra = extraWebWatchUrlsFromEnv();
  return [...new Set([...WEB_WATCH_URLS.map((w) => w.url), ...extra])];
}
