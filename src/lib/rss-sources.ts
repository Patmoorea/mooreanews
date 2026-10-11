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
  /** Flux parfois hors ligne (522, etc.) — pas d’alerte Telegram. */
  optional?: boolean;
  /** Logo ou favicon de la source. */
  iconUrl?: string;
  /**
   * Google Actualités : ne garder que les articles de ces médias
   * (domaine de `<source url>` ou du lien). Vide = pas de filtre.
   */
  allowedSourceDomains?: string[];
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
  "maiao",
  "tiahura",
  "teavaro",
  "hauru",
];

/**
 * Médias / institutions polynésiens acceptés depuis Google Actualités.
 * Évite le bruit (chevaux « Moorea », campings, médias nationaux hors sujet).
 */
export const LOCAL_MEDIA_DOMAINS = [
  "tahiti-infos.com",
  "tntvnews.pf",
  "tntv.pf",
  "radio1.pf",
  "la1ere.franceinfo.fr",
  "la1ere.francetvinfo.fr",
  "outremers360.com",
  "gouvernement.pf",
  "presidence.pf",
  "polynesie-francaise.pref.gouv.fr",
  "assemblee.pf",
  "commune-moorea.net",
  "moorea.life",
  "lesnouvelles.pf",
  "tahitiheritage.pf",
  "tahititourisme.pf",
  "service-public.pf",
];

/** Requête Google Actualités : Moorea + quartiers / lieux, 7 derniers jours. */
const GOOGLE_NEWS_MOOREA_TERMS =
  "Moorea OR Maiao OR Opunohu OR Afareaitu OR Haapiti OR Papetoai OR Paopao OR Maharepa OR Vaiare OR Temae OR Tiahura OR Teavaro";

function googleNewsRss(query: string): string {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=PF&ceid=PF:fr`;
}

export const RSS_SOURCES: RssSource[] = [
  {
    id: "commune-moorea",
    name: "Commune de Moorea-Maiao",
    url: "https://www.commune-moorea.net/feed/",
    homepage: "https://www.commune-moorea.net",
    acceptAll: true,
    autoPublishAsArticles: true,
    priority: 100,
    /**
     * Flux WordPress techniquement OK (HTTP 200, RSS valide) mais la commune
     * ne publie plus d’articles sur son site depuis le 2 sept. 2025 : elle
     * communique sur Facebook (page CommuneMooreaMaiao). Gardé pour reprise ;
     * relais via Google Actualités (médias locaux) en attendant un accès Graph.
     */
    optional: true,
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
    /**
     * L’ancien flux https://la1ere.francetvinfo.fr/polynesie/rss redirige
     * (301) vers la page d’accueil HTML depuis le passage au domaine
     * la1ere.franceinfo.fr : plus de RSS officiel. Remplacé par Google
     * Actualités restreint au site, filtré Moorea sur le titre.
     */
    id: "polynesie-1ere",
    name: "Polynésie La 1ère",
    url: googleNewsRss(
      `(${GOOGLE_NEWS_MOOREA_TERMS}) site:la1ere.franceinfo.fr when:7d`,
    ),
    homepage: "https://la1ere.franceinfo.fr/polynesie/",
    keywords: MOOREA_KEYWORDS,
    allowedSourceDomains: ["la1ere.franceinfo.fr", "la1ere.francetvinfo.fr"],
    priority: 70,
    optional: true,
  },
  {
    /**
     * presidence.pf/feed/ redirige (301) vers gouvernement.pf, qui n’a pas
     * de flux RSS (404). Remplacé par Google Actualités restreint au site.
     */
    id: "presidence-pf",
    name: "Gouvernement de la Polynésie (Présidence)",
    url: googleNewsRss(
      `(${GOOGLE_NEWS_MOOREA_TERMS}) site:gouvernement.pf when:30d`,
    ),
    homepage: "https://gouvernement.pf/fr/actualites",
    keywords: MOOREA_KEYWORDS,
    allowedSourceDomains: ["gouvernement.pf", "presidence.pf"],
    priority: 60,
    optional: true,
  },
  {
    id: "google-news-coupures-moorea",
    name: "Google Actualités (coupures Moorea)",
    url: "https://news.google.com/rss/search?q=coupure+%C3%A9lectricit%C3%A9+OR+coupure+eau+Moorea+Maiao&hl=fr&gl=PF&ceid=PF:fr",
    homepage: "https://news.google.com",
    keywords: ["coupure", "électricité", "electricite", "eau", "moorea"],
    acceptAll: false,
    priority: 85,
  },
  {
    /**
     * Ancienne requête « Moorea Maiao Polynésie » = 3 mots obligatoires,
     * presque aucun article ne contient « Maiao » → 0 résultat récent.
     * Nouvelle requête : OU entre lieux, 7 jours, médias polynésiens seulement,
     * mot-clé Moorea exigé dans le titre (TNTV, Radio1, Outremers360… inclus).
     */
    id: "google-news-moorea",
    name: "Google Actualités (Moorea — médias locaux)",
    url: googleNewsRss(`(${GOOGLE_NEWS_MOOREA_TERMS}) when:7d`),
    homepage: "https://news.google.com",
    keywords: MOOREA_KEYWORDS,
    allowedSourceDomains: LOCAL_MEDIA_DOMAINS,
    priority: 75,
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
