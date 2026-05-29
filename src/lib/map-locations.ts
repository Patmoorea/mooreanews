/**
 * Coordonnées géographiques des points d'intérêt de Moorea.
 * Utilisé par la carte interactive Leaflet.
 */

export type MapMarker = {
  id: string;
  name: string;
  category: "restaurant" | "activite" | "info" | "ferry" | "plage";
  lat: number;
  lon: number;
  description?: string;
  href?: string;
  /** Logo personnalisé (épingle carte) */
  iconUrl?: string;
};

/**
 * Marqueurs notables de Moorea (sélection MVP).
 * Coordonnées approximatives mais cohérentes.
 */
/** Points fixes (ferries, plages…) — complétés par l’admin (restaurants, activités, infos). */
export const STATIC_MAP_MARKERS: MapMarker[] = [
  // Débarcadères / transports
  {
    id: "vaiare-ferry",
    name: "Débarcadère de Vaiare",
    category: "ferry",
    lat: -17.4946,
    lon: -149.7672,
    description: "Ferries Tahiti ↔ Moorea (Aremiti, Terevau)",
    href: "/infos-pratiques",
  },
  {
    id: "temae-airport",
    name: "Aérodrome de Temae",
    category: "ferry",
    lat: -17.4898,
    lon: -149.7619,
    description: "Vols quotidiens vers Tahiti (Air Tahiti, Air Moana)",
    href: "/infos-pratiques",
  },
  // Restaurants
  {
    id: "tama-hau",
    name: "Chez Tama Hau",
    category: "restaurant",
    lat: -17.5189,
    lon: -149.8859,
    description: "Cuisine locale et bar, terrasse face au lagon",
    href: "/restaurants",
  },
  {
    id: "mahogany",
    name: "Le Mahogany",
    category: "restaurant",
    lat: -17.4837,
    lon: -149.7889,
    description: "Restaurant gastronomique de plage",
    href: "/restaurants",
  },
  {
    id: "mahana",
    name: "Snack Mahana",
    category: "restaurant",
    lat: -17.4928,
    lon: -149.8197,
    description: "Cantine locale, plat du jour 1500 XPF",
    href: "/restaurants",
  },
  {
    id: "beach-cafe",
    name: "Moorea Beach Café",
    category: "restaurant",
    lat: -17.4912,
    lon: -149.7672,
    description: "Brunch et pizza les pieds dans le sable",
    href: "/restaurants",
  },
  // Activités
  {
    id: "pointe-tortues",
    name: "Plongée Pointe aux Tortues",
    category: "activite",
    lat: -17.4828,
    lon: -149.7541,
    description: "Site de plongée emblématique de Moorea",
    href: "/activites",
  },
  {
    id: "belvedere",
    name: "Belvédère des 3 Cocotiers",
    category: "activite",
    lat: -17.5408,
    lon: -149.8233,
    description: "Vue panoramique sur les baies Cook et Opunohu",
    href: "/activites",
  },
  {
    id: "opunohu-bay",
    name: "Baie d'Opunohu",
    category: "activite",
    lat: -17.4900,
    lon: -149.8500,
    description: "Kayak et excursions lagon",
    href: "/activites",
  },
  // Plages
  {
    id: "temae-plage",
    name: "Plage de Temae",
    category: "plage",
    lat: -17.4880,
    lon: -149.7611,
    description: "Sable blanc et eaux turquoise — ponte des tortues",
  },
  {
    id: "tiahura-plage",
    name: "Plage de Tiahura",
    category: "plage",
    lat: -17.5408,
    lon: -149.9019,
    description: "Plage de référence sur la côte ouest",
  },
  // Infos pratiques
  {
    id: "mairie",
    name: "Mairie de Moorea-Maiao",
    category: "info",
    lat: -17.5544,
    lon: -149.7747,
    description: "Démarches administratives, état civil",
    href: "/infos-pratiques",
  },
  {
    id: "hopital",
    name: "Hôpital d'Afareaitu",
    category: "info",
    lat: -17.5544,
    lon: -149.7800,
    description: "Urgences 24h/24",
    href: "/infos-pratiques",
  },
  {
    id: "rai-tahiti-pihaena",
    name: "RAI TAHITI — VSL",
    category: "info",
    lat: -17.5185,
    lon: -149.772,
    description: "Transport sanitaire — base Pihaena (PK 14,5) · 89 77 76 24",
    href: "/infos-pratiques/rai-tahiti-vsl",
    iconUrl: "/partners/raitahiti-marker.svg",
  },
  {
    id: "marche-paopao",
    name: "Marché de Pao Pao",
    category: "info",
    lat: -17.4901,
    lon: -149.8197,
    description: "Marché local, ouvert tous les matins",
    href: "/actualites",
  },
];

export const MOOREA_CENTER: [number, number] = [-17.5388, -149.8295];

/** @deprecated Utiliser buildMapMarkers() — conservé pour imports existants */
export const MAP_MARKERS = STATIC_MAP_MARKERS;
