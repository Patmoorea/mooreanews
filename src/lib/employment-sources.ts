/**
 * Sources emploi & formation — Moorea (IDs stable pour external_articles).
 */

export const SEFI_JOBS_SOURCE_ID = "sefi-offres-moorea";
export const SEFI_TRAINING_SOURCE_ID = "sefi-formation-moorea";
export const ARAVIHI_JOBS_SOURCE_ID = "aravihi-emploi-moorea";
export const CGF_JOBS_SOURCE_ID = "cgf-emploi-moorea";
export const COMMUNE_EMPLOI_SOURCE_ID = "commune-emploi-moorea";

export const SEFI_JOBS_SOURCE_NAME = "SEFI — Offres d'emploi";
export const SEFI_TRAINING_SOURCE_NAME = "SEFI — Formation & ateliers";
export const ARAVIHI_JOBS_SOURCE_NAME = "Aravihi — Administration (Moorea)";
export const CGF_JOBS_SOURCE_NAME = "CGF — Communes (Moorea-Maiao)";
export const COMMUNE_EMPLOI_SOURCE_NAME = "Commune Moorea-Maiao";

export const ALL_EMPLOYMENT_SOURCE_IDS = [
  SEFI_JOBS_SOURCE_ID,
  SEFI_TRAINING_SOURCE_ID,
  ARAVIHI_JOBS_SOURCE_ID,
  CGF_JOBS_SOURCE_ID,
  COMMUNE_EMPLOI_SOURCE_ID,
] as const;

export const SEFI_SERVICES_BASE = "https://services.sefi.pf";
export const SEFI_SITE_BASE = "https://sefi.pf";

export const SEFI_MOOREA_JOBS_SEARCH_URL =
  `${SEFI_SERVICES_BASE}/SefiWeb/SefiOffres.nsf/RechercheOffreWeb1?SearchView&Query=` +
  encodeURIComponent("([Form]=mVisuOffre)AND([Ile]=MOOREA)") +
  "&SearchOrder=4";

export const SEFI_PUBLIC_JOB_SEARCH_URL =
  `${SEFI_SERVICES_BASE}/SefiWeb/SefiOffres.nsf/RechercheOffreWeb?OpenForm`;

export const SEFI_ACTUALITES_URL = `${SEFI_SITE_BASE}/actualites/`;

export const ARAVIHI_MOOREA_RSS_URL =
  "https://www.aravihi.gov.pf/handlers/offerRss.ashx?lcid=1036&Rss_Region=7648";

export const ARAVIHI_MOOREA_SEARCH_URL =
  "https://www.aravihi.gov.pf/offre-de-emploi/liste-toutes-offres.aspx?facet_JobRegion=7648";

export const CGF_OFFERS_URL = "https://www.cgf.pf/offres-demploi";

export const COMMUNE_RECRUTE_URL =
  "https://www.commune-moorea.net/vie-municipale/la-commune-recrute/";

export const COMMUNE_RSS_URL = "https://www.commune-moorea.net/feed/";

export const EMPLOI_PUBLIC_URL = "https://www.emploipublic.fr";

export const LYCEE_OPUNOHU_URL = "http://www.etablissement-opunohu.com";

/** Antenne SEFI Moorea */
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

/** Liens officiels (pas toujours agrégeables automatiquement). */
export const EMPLOYMENT_EXTERNAL_LINKS = [
  {
    title: "SEFI — Recherche d'emploi",
    href: SEFI_PUBLIC_JOB_SEARCH_URL,
    description: "Secteur privé et insertion professionnelle.",
  },
  {
    title: "Aravihi — Administration du Pays (Moorea)",
    href: ARAVIHI_MOOREA_SEARCH_URL,
    description: "Fonction publique de la Polynésie française sur l'île.",
  },
  {
    title: "CGF Tahiti — Offres des communes",
    href: CGF_OFFERS_URL,
    description: "Commune de Moorea-Maiao, Te Ito Rau, EPA locaux.",
  },
  {
    title: "Commune de Moorea-Maiao — Recrutement",
    href: COMMUNE_RECRUTE_URL,
    description: "Candidatures, stages et apprentissage communal.",
  },
  {
    title: "Emploi public (État)",
    href: EMPLOI_PUBLIC_URL,
    description: "Concours et postes de l'État.",
  },
  {
    title: "Lycée professionnel agricole d'Opunohu",
    href: LYCEE_OPUNOHU_URL,
    description: "Formations agricoles et apprentissage à Moorea.",
  },
  {
    title: "Petites annonces MooreaNews",
    href: "/annonces",
    description: "Annonces locales type emploi publiées sur le site.",
    internal: true,
  },
] as const;

/** Communes / EPA CGF rattachés à Moorea-Maiao. */
export const CGF_MOOREA_COMMUNE_SLUGS = ["moorea-maiao", "teitorau"] as const;
