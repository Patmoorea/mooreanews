/** Métadonnées thèmes saisonniers — sûr client & serveur (pas de Supabase). */

export type SeasonThemeId =
  | "coupe-monde"
  | "heiva"
  | "hawaiki-nui"
  | "noel"
  | "nouvel-an"
  | "fete-musique"
  | "fete-autonomie"
  | "juillet-14"
  | "paques"
  | "toussaint"
  | "baleines"
  | "xterra"
  | "matiti-run";

export type SeasonThemeMeta = {
  id: SeasonThemeId;
  label: string;
  motifs: string[];
};

export const SEASON_THEME_CATALOG: Record<SeasonThemeId, SeasonThemeMeta> = {
  "coupe-monde": {
    id: "coupe-monde",
    label: "Coupe du monde",
    motifs: ["⚽", "🏆", "🌍"],
  },
  heiva: {
    id: "heiva",
    label: "Heiva i Moorea",
    motifs: ["🌺", "💃", "🥁"],
  },
  "hawaiki-nui": {
    id: "hawaiki-nui",
    label: "Hawaiki Nui Va'a",
    motifs: ["🛶", "🌊", "🏝️"],
  },
  noel: {
    id: "noel",
    label: "Noël",
    motifs: ["🎄", "⭐", "🎁"],
  },
  "nouvel-an": {
    id: "nouvel-an",
    label: "Nouvel An & Tūrai",
    motifs: ["🎆", "✨", "🥂"],
  },
  "fete-musique": {
    id: "fete-musique",
    label: "Fête de la musique",
    motifs: ["🎵", "🎸", "🎤"],
  },
  "fete-autonomie": {
    id: "fete-autonomie",
    label: "Fête de l’Autonomie",
    motifs: ["🇵🇫", "🌺", "🎭"],
  },
  "juillet-14": {
    id: "juillet-14",
    label: "14 juillet",
    motifs: ["🇫🇷", "🎆", "🎇"],
  },
  paques: {
    id: "paques",
    label: "Pâques",
    motifs: ["🐣", "🌼", "🥚"],
  },
  toussaint: {
    id: "toussaint",
    label: "Toussaint",
    motifs: ["🌸", "🕯️", "🌿"],
  },
  baleines: {
    id: "baleines",
    label: "Saison baleines",
    motifs: ["🐋", "🌊", "🐚"],
  },
  xterra: {
    id: "xterra",
    label: "XTERRA Moorea",
    motifs: ["🏃", "⛰️", "🚴"],
  },
  "matiti-run": {
    id: "matiti-run",
    label: "Matiti Run",
    motifs: ["🏃", "🌴", "💪"],
  },
};

export function getSeasonThemeMeta(
  id: SeasonThemeId | null,
): SeasonThemeMeta | null {
  if (!id) return null;
  return SEASON_THEME_CATALOG[id];
}

export function seasonThemeColor(id: SeasonThemeId | null): string {
  switch (id) {
    case "coupe-monde":
      return "#16a34a";
    case "heiva":
      return "#c026d3";
    case "hawaiki-nui":
      return "#ea580c";
    case "noel":
      return "#dc2626";
    case "nouvel-an":
      return "#ca8a04";
    case "fete-musique":
      return "#9333ea";
    case "fete-autonomie":
    case "juillet-14":
      return "#2563eb";
    case "paques":
      return "#eab308";
    case "toussaint":
      return "#78716c";
    case "baleines":
      return "#0284c7";
    case "xterra":
    case "matiti-run":
      return "#059669";
    default:
      return "#06b6d4";
  }
}
