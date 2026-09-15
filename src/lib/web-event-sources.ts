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
 * Événements / escales / sport connus (complément manuel).
 * Les escales Windstar Star Breeze sont aussi découvertes automatiquement
 * via DELUXE_CRUISES_STAR_BREEZE_YEAR.
 */
export type ManualEventSeed = {
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

/** @deprecated alias — préférer ManualEventSeed */
export type CruiseStopSeed = ManualEventSeed;

/** Liste des croisières Star Breeze (itinéraires jour par jour, dont Moorea). */
export const DELUXE_CRUISES_STAR_BREEZE_YEAR =
  "https://deluxecruises.com/windstar/star-breeze/cruises-2026/";

/** Pages opérateurs / presse / circuits à sonder (souvent hors agendas locaux). */
export const TOUR_OPERATOR_WATCH_URLS: { url: string; label: string }[] = [
  {
    url: "https://www.santanaadventures.com/tahiti-2026/",
    label: "Santana Adventures — Tahiti cycling cruise",
  },
  {
    url: "https://www.wetravel.com/trips/7986671479",
    label: "WeTravel — Tahiti cycling cruise",
  },
  {
    url: "https://www.tahiti-infos.com/Cyclisme-Le-Tour-Tahiti-Nui-va-vivre-sa-30e-edition_a239361.html",
    label: "Tahiti Infos — Tour Tahiti Nui 2026",
  },
  {
    url: "https://www.radio1.pf/au-30e-tour-tahiti-nui-tout-le-monde-a-tahiti-2027-en-visuel/",
    label: "Radio1 — Tour Tahiti Nui 2026 Moorea",
  },
];

/** Requêtes web (DuckDuckGo HTML) pour attraper croisières / sport hors agendas. */
export const MOOREA_WEB_SEARCH_QUERIES = [
  'Moorea "Star Breeze" OR Windstar escale OR port',
  "Moorea vélo OR cycling cruise OR peloton OR Santana Adventures Tahiti",
  "Tour Tahiti Nui Moorea OR cyclisme FTC",
  "Moorea course cycliste OR contre-la-montre OR peloton",
  "Moorea croisière escale",
  "Moorea événement OR festival OR course OR foire OR marché",
];

/**
 * Graines manuelles (sport, croisières, etc.) — secours si le scrape / la presse
 * ne créent pas encore de fiche agenda.
 */
export const MANUAL_EVENT_SEEDS: ManualEventSeed[] = [
  {
    id: "tour-tahiti-nui-2026-moorea-ligne",
    title: "Tour Tahiti Nui — étape Moorea (course en ligne)",
    date: "2026-09-15",
    startTime: "08:00",
    location: "Routes de Moorea (tour de l'île)",
    description:
      "30ᵉ édition du Tour Tahiti Nui / Raromatai. Étape en ligne à Moorea (~98 km), organisée comme test event en vue des épreuves sur route des Jeux du Pacifique Tahiti 2027. Circulation perturbée possible sur la ceinture. Organisateur : Fédération tahitienne de cyclisme (FTC).",
    url: "https://www.tahiti-infos.com/Cyclisme-Le-Tour-Tahiti-Nui-va-vivre-sa-30e-edition_a239361.html",
    organizer: "Fédération tahitienne de cyclisme (FTC)",
    category: "sport",
  },
  {
    id: "tour-tahiti-nui-2026-moorea-clm",
    title: "Tour Tahiti Nui — étape Moorea (contre-la-montre)",
    date: "2026-09-16",
    startTime: "08:00",
    location: "Routes de Moorea",
    description:
      "Deuxième journée Moorea du Tour Tahiti Nui / Raromatai 2026 : contre-la-montre (~23 km), également retenu comme test event pour Tahiti 2027. Circulation et contrôles possibles. Organisateur : Fédération tahitienne de cyclisme (FTC).",
    url: "https://www.radio1.pf/au-30e-tour-tahiti-nui-tout-le-monde-a-tahiti-2027-en-visuel/",
    organizer: "Fédération tahitienne de cyclisme (FTC)",
    category: "sport",
  },
];

/** @deprecated utiliser MANUAL_EVENT_SEEDS */
export const CRUISE_STOP_SEEDS: ManualEventSeed[] = [];

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
