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
  /** Plus élevé = traité en priorité (commune, sources officielles). */
  priority?: number;
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
    id: "commune-moorea",
    name: "Commune de Moorea-Maiao",
    url: "https://www.commune-moorea.net/feed/",
    homepage: "https://www.commune-moorea.net",
    acceptAll: true,
    autoPublishAsArticles: true,
    priority: 100,
  },
  {
    id: "tahiti-infos",
    name: "Tahiti Infos",
    url: "https://www.tahiti-infos.com/xml/syndication.rss",
    homepage: "https://www.tahiti-infos.com",
    keywords: MOOREA_KEYWORDS,
    autoPublishAsArticles: true,
    priority: 80,
  },
  {
    id: "polynesie-1ere",
    name: "Polynésie La 1ère",
    url: "https://la1ere.francetvinfo.fr/polynesie/rss",
    homepage: "https://la1ere.francetvinfo.fr/polynesie",
    keywords: MOOREA_KEYWORDS,
    priority: 70,
  },
  {
    id: "presidence-pf",
    name: "Présidence de la Polynésie",
    url: "https://www.presidence.pf/feed/",
    homepage: "https://www.presidence.pf",
    keywords: MOOREA_KEYWORDS,
    priority: 60,
  },
  {
    id: "google-news-moorea",
    name: "Google Actualités (Moorea)",
    url: "https://news.google.com/rss/search?q=Moorea+Maiao+Polyn%C3%A9sie&hl=fr&gl=PF&ceid=PF:fr",
    homepage: "https://news.google.com",
    acceptAll: true,
    priority: 30,
  },
];

export function sortSourcesByPriority(sources: RssSource[]): RssSource[] {
  return sources.slice().sort(
    (a, b) => (b.priority ?? 50) - (a.priority ?? 50),
  );
}

export function rssSourcesByPriority(): RssSource[] {
  return sortSourcesByPriority(RSS_SOURCES);
}

export function getSourceById(id: string): RssSource | undefined {
  return RSS_SOURCES.find((s) => s.id === id);
}
