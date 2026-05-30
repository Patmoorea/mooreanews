/** Plages Moorea — référentiel pour scores baignade. */

export type BeachSpot = {
  slug: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  /** nord = plus abrité vent est alizé */
  exposure: "north" | "east" | "west" | "south";
  snorkel: boolean;
};

export const MOOREA_BEACHES: BeachSpot[] = [
  { slug: "temae", name: "Temae", district: "Temae", lat: -17.503, lon: -149.762, exposure: "north", snorkel: true },
  { slug: "taahiamanu", name: "Ta'ahiamanu (Opunohu)", district: "Papetoai", lat: -17.489, lon: -149.839, exposure: "north", snorkel: true },
  { slug: "tiahura", name: "Tiahura", district: "Tiahura", lat: -17.496, lon: -149.833, exposure: "north", snorkel: true },
  { slug: "tipaniers", name: "Tipaniers", district: "Haapiti", lat: -17.478, lon: -149.865, exposure: "west", snorkel: true },
  { slug: "paopao", name: "Paopao", district: "Paopao", lat: -17.492, lon: -149.812, exposure: "east", snorkel: true },
  { slug: "vaiare", name: "Vaiare", district: "Vaiare", lat: -17.507, lon: -149.776, exposure: "east", snorkel: false },
];
