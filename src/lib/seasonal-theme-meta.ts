export const SEASONAL_THEME_IDS = [
  "nouvel-an",
  "saint-valentin",
  "paques",
  "heiva",
  "baleines",
  "hawaiki-nui",
  "rentree-scolaire",
  "octobre-rose",
  "coupe-du-monde",
  "noel",
  "vigilance-meteo",
  "anniversaire",
] as const;

export type SeasonalThemeId = (typeof SEASONAL_THEME_IDS)[number];

export type SeasonalThemeMeta = {
  label: string;
  hasBanner: boolean;
  cssVars: Record<string, string>;
};

export const SEASONAL_THEME_META: Record<SeasonalThemeId, SeasonalThemeMeta> = {
  "nouvel-an": {
    label: "Nouvel An",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#d4a017",
      "--season-accent-soft": "rgb(212 160 23 / 0.12)",
    },
  },
  "saint-valentin": {
    label: "Saint-Valentin",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#e11d48",
      "--season-accent-soft": "rgb(225 29 72 / 0.12)",
    },
  },
  paques: {
    label: "Pâques",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#059669",
      "--season-accent-soft": "rgb(5 150 105 / 0.12)",
    },
  },
  heiva: {
    label: "Heiva i Tahiti",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#d97706",
      "--season-accent-soft": "rgb(217 119 6 / 0.14)",
    },
  },
  baleines: {
    label: "Saison des baleines",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#0284c7",
      "--season-accent-soft": "rgb(2 132 199 / 0.12)",
    },
  },
  "hawaiki-nui": {
    label: "Hawaiki Nui",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#0891b2",
      "--season-accent-soft": "rgb(8 145 178 / 0.12)",
    },
  },
  "rentree-scolaire": {
    label: "Rentrée scolaire",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#2563eb",
      "--season-accent-soft": "rgb(37 99 235 / 0.12)",
    },
  },
  "octobre-rose": {
    label: "Octobre Rose",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#db2777",
      "--season-accent-soft": "rgb(219 39 119 / 0.14)",
    },
  },
  "coupe-du-monde": {
    label: "Coupe du monde",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#16a34a",
      "--season-accent-soft": "rgb(22 163 74 / 0.12)",
    },
  },
  noel: {
    label: "Noël",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#dc2626",
      "--season-accent-soft": "rgb(220 38 38 / 0.12)",
    },
  },
  "vigilance-meteo": {
    label: "Vigilance météo",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#ca8a04",
      "--season-accent-soft": "rgb(202 138 4 / 0.14)",
    },
  },
  anniversaire: {
    label: "Anniversaire MooreaNews",
    hasBanner: true,
    cssVars: {
      "--season-accent": "#7c3aed",
      "--season-accent-soft": "rgb(124 58 237 / 0.12)",
    },
  },
};
