/** Sources SEFI (emploi + formation) — Moorea. */

export const SEFI_JOBS_SOURCE_ID = "sefi-offres-moorea";
export const SEFI_TRAINING_SOURCE_ID = "sefi-formation-moorea";

export const SEFI_JOBS_SOURCE_NAME = "SEFI — Offres d'emploi";
export const SEFI_TRAINING_SOURCE_NAME = "SEFI — Formation & ateliers";

export const SEFI_SERVICES_BASE = "https://services.sefi.pf";
export const SEFI_SITE_BASE = "https://sefi.pf";

/** Recherche officielle des offres sur l'île MOOREA (Lotus Notes). */
export const SEFI_MOOREA_JOBS_SEARCH_URL =
  `${SEFI_SERVICES_BASE}/SefiWeb/SefiOffres.nsf/RechercheOffreWeb1?SearchView&Query=` +
  encodeURIComponent("([Form]=mVisuOffre)AND([Ile]=MOOREA)") +
  "&SearchOrder=4";

export const SEFI_PUBLIC_JOB_SEARCH_URL =
  `${SEFI_SERVICES_BASE}/SefiWeb/SefiOffres.nsf/RechercheOffreWeb?OpenForm`;

export const SEFI_ACTUALITES_URL = `${SEFI_SITE_BASE}/actualites/`;

/** Antenne Moorea (référence carte SEFI). */
export const SEFI_MOOREA_ANTENNE = {
  title: "Antenne SEFI Moorea",
  address: "Centre commercial Tumai — Tiaia",
  phone: "40 56 49 19",
  email: "antenne.moorea@administration.gov.pf",
  hours:
    "Lun–mer 7h30–12h (sans rdv), 13h–15h30 sur rdv · jeu–ven fermé au public",
  jobSearchUrl: SEFI_PUBLIC_JOB_SEARCH_URL,
  siteUrl: SEFI_SITE_BASE,
} as const;
