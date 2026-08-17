/**
 * Sources et graines pour la veille agenda Moorea (fin de semaine).
 */

/** Pages Tahiti Tourisme connues (événements Moorea récurrents / durables). */
export const TAHITI_TOURISME_MOOREA_SEEDS: { url: string; label: string }[] = [
  {
    url: "https://tahititourisme.pf/agenda/tout-lagenda/marche-bio-de-moorea-moorea-fr-6712915/",
    label: "Marché BIO de Moorea",
  },
  {
    url: "https://tahititourisme.pf/agenda/tout-lagenda/vigie-a-terre-oceania-paopao-moorea-fr-6712902/",
    label: "Vigie à terre Oceania — Paopao",
  },
];

/** Listings à parcourir pour découvrir de nouveaux liens Moorea. */
export const TAHITI_TOURISME_LISTING_URLS = [
  "https://tahititourisme.pf/agenda/tout-lagenda/",
];

export const FENUA_AGENDA_MOOREA_LIST =
  "https://www.fenua-agenda.com/cateventslist.php?ile=MOOREA";

export const FENUA_AGENDA_EVENT_BASE =
  "https://www.fenua-agenda.com/event-detail.php?id_event=";

/**
 * Escales croisière / circuits connus (complément manuel).
 * Les escales Windstar Star Breeze sont aussi découvertes automatiquement
 * via DELUXE_CRUISES_STAR_BREEZE_YEAR.
 */
export type CruiseStopSeed = {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location: string;
  district?: string;
  description: string;
  url: string;
  organizer?: string;
  category?: string;
};

/** Liste des croisières Star Breeze (itinéraires jour par jour, dont Moorea). */
export const DELUXE_CRUISES_STAR_BREEZE_YEAR =
  "https://deluxecruises.com/windstar/star-breeze/cruises-2026/";

/** Pages opérateurs / circuits à sonder (souvent hors agendas locaux). */
export const TOUR_OPERATOR_WATCH_URLS: { url: string; label: string }[] = [
  {
    url: "https://www.santanaadventures.com/tahiti-2026/",
    label: "Santana Adventures — Tahiti cycling cruise",
  },
  {
    url: "https://www.wetravel.com/trips/7986671479",
    label: "WeTravel — Tahiti cycling cruise",
  },
];

/** Requêtes web (DuckDuckGo HTML) pour attraper croisières / sport hors agendas. */
export const MOOREA_WEB_SEARCH_QUERIES = [
  'Moorea "Star Breeze" OR Windstar escale OR port',
  "Moorea vélo OR cycling cruise OR peloton OR Santana Adventures Tahiti",
  "Moorea croisière escale 2026",
  "Moorea événement OR festival OR course OR foire OR marché",
];

/** Graines manuelles (secours si le scrape échoue). */
export const CRUISE_STOP_SEEDS: CruiseStopSeed[] = [];

/** Marché bio : 1er samedi du mois, face au restaurant Rudy’s. */
export const MARCHE_BIO = {
  id: "marche-bio-moorea",
  title: "Marché BIO de Moorea",
  location: "En face du restaurant Rudy's, Moorea",
  district: "Maharepa",
  startTime: "08:00",
  endTime: "12:00",
  url: "https://tahititourisme.pf/agenda/tout-lagenda/marche-bio-de-moorea-moorea-fr-6712915/",
  organizer: "Producteurs Bio Pasifika",
  description:
    "Tous les premiers samedis du mois : producteurs locaux certifiés Bio Pasifika (fruits, légumes, œufs, artisanat culinaire). Entrée libre, 8h–12h, en face du restaurant Rudy’s.",
} as const;
