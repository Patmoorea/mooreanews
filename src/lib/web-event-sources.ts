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
 * Escales croisière / circuits connus (complément quand les sites ne listent
 * pas clairement Moorea). Mettre à jour au fil des saisons.
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

export const CRUISE_STOP_SEEDS: CruiseStopSeed[] = [
  {
    id: "windstar-star-breeze-2026-08-26",
    title: "Escale croisière Windstar — MS Star Breeze",
    date: "2026-08-26",
    startTime: "08:00",
    endTime: "18:00",
    location: "Moorea",
    description:
      "Escale prévue du MS Star Breeze (Windstar Cruises) à Moorea. Activités et excursions possibles sur l’île (vélo, lagon, villages). Horaires indicatifs 8h–18h — à confirmer auprès de l’organisateur.",
    url: "https://www.windstarcruises.com/cruise-destinations/tahiti/",
    organizer: "Windstar Cruises",
    category: "autre",
  },
];

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
