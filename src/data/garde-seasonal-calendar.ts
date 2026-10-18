/**
 * Bandeau saisonnier de l'affiche garde MooreaNews.
 *
 * Pour ajouter ou corriger une campagne : une ligne dans le tableau.
 * `months` : mois 1–12. Un mois absent reste neutre.
 * Le rose n'existe que pour Octobre Rose. Les autres bandeaux n'utilisent pas de rose.
 */

export const GARDE_SEASONAL_CALENDAR = [
  {
    id: "octobre-rose",
    months: [10],
    label: "Octobre Rose",
    background: "#C2185B",
    color: "#F4EFE6",
  },
  {
    id: "novembre-bleu",
    months: [11],
    label: "Novembre bleu",
    background: "#1B4F8A",
    color: "#F4EFE6",
  },
  {
    id: "fetes",
    months: [12],
    label: "Fêtes",
    background: "#0F6E73",
    color: "#F4EFE6",
  },
] as const;

export type GardeSeasonId = (typeof GARDE_SEASONAL_CALENDAR)[number]["id"] | "neutral";

export type GardeSeasonBand = {
  id: GardeSeasonId;
  label: string;
  background: string;
  color: string;
};

/** Bandeau sans campagne : océan, sans texte, sans rose. */
export const GARDE_NEUTRAL_BAND: GardeSeasonBand = {
  id: "neutral",
  label: "",
  background: "#072844",
  color: "#F4EFE6",
};

export function gardeSeasonForMonth(month: number): GardeSeasonBand {
  const found = GARDE_SEASONAL_CALENDAR.find((band) =>
    (band.months as readonly number[]).includes(month),
  );
  if (!found) return GARDE_NEUTRAL_BAND;
  return {
    id: found.id,
    label: found.label,
    background: found.background,
    color: found.color,
  };
}

/** Mois du premier jour de la garde (YYYY-MM-DD). Date illisible : neutre. */
export function gardeSeasonForIsoDate(iso: string): GardeSeasonBand {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return GARDE_NEUTRAL_BAND;
  const month = Number(iso.slice(5, 7));
  if (!Number.isInteger(month) || month < 1 || month > 12) return GARDE_NEUTRAL_BAND;
  return gardeSeasonForMonth(month);
}
