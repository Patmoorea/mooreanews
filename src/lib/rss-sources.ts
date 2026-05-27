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
    id: "radio1-tahiti",
    name: "Radio 1 Tahiti",
    url: "https://www.radio1.pf/feed/",
    homepage: "https://www.radio1.pf",
    keywords: MOOREA_KEYWORDS,
  },
];

export function getSourceById(id: string): RssSource | undefined {
  return RSS_SOURCES.find((s) => s.id === id);
}
