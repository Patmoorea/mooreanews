/**
 * Sources RSS surveillées par MooreaNews.
 * Configurer ici les flux à agréger ; chaque flux a un identifiant stable,
 * un nom lisible et des règles de filtrage.
 */

export type RssSource = {
  id: string;
  name: string;
  url: string;
  homepage: string;
  /** Mots-clés à matcher dans titre/excerpt (insensible aux accents/casse). */
  keywords?: string[];
  /** Si true, on accepte tous les articles (pas de filtre par mots-clés). */
  acceptAll?: boolean;
  /** Si true, le cron crée aussi une fiche dans Actualités (table articles). */
  autoPublishAsArticles?: boolean;
  /** Logo ou favicon de la source. */
  iconUrl?: string;
};

/** Mots-clés Moorea (lieux, communes, surnoms). */
export const MOOREA_KEYWORDS = [
  "moorea",
  "moorea-maiao",
  "afareaitu",
  "haapiti",
  "papetoai",
  "pao pao",
  "paopao",
  "maharepa",
  "vaiare",
  "temae",
  "varari",
  "atiha",
  "tipanier",
  "opunohu",
  "te pari",
  "mont rotui",
  "rotui",
  "tohivea",
  "île sœur",
  "ile soeur",
];

export const RSS_SOURCES: RssSource[] = [
  {
    id: "tahiti-infos",
    name: "Tahiti Infos",
    url: "https://www.tahiti-infos.com/xml/syndication.rss",
    homepage: "https://www.tahiti-infos.com",
    keywords: MOOREA_KEYWORDS,
    autoPublishAsArticles: true,
  },
  {
    id: "polynesie-1ere",
    name: "Polynésie La 1ère",
    url: "https://la1ere.francetvinfo.fr/polynesie/rss",
    homepage: "https://la1ere.francetvinfo.fr/polynesie",
    keywords: MOOREA_KEYWORDS,
  },
  {
    id: "presidence-pf",
    name: "Présidence de la Polynésie",
    url: "https://www.presidence.pf/feed/",
    homepage: "https://www.presidence.pf",
    keywords: MOOREA_KEYWORDS,
  },
  {
    id: "commune-moorea",
    name: "Commune de Moorea-Maiao",
    url: "https://www.commune-moorea.net/feed/",
    homepage: "https://www.commune-moorea.net",
    acceptAll: true,
    autoPublishAsArticles: true,
  },
  {
    id: "google-news-moorea",
    name: "Google Actualités (Moorea)",
    url: "https://news.google.com/rss/search?q=Moorea+Maiao+Polyn%C3%A9sie&hl=fr&gl=PF&ceid=PF:fr",
    homepage: "https://news.google.com",
    acceptAll: true,
  },
];

export function getSourceById(id: string): RssSource | undefined {
  return RSS_SOURCES.find((s) => s.id === id);
}
