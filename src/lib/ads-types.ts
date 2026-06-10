export type AdFormat =
  | "leaderboard"
  | "billboard"
  | "rectangle"
  | "sidebar"
  | "card"
  | "ribbon";

export type AdCampaign = {
  id: string;
  name: string;
  /** Visuel principal (aperçu admin, repli si pas de visuel par format). */
  image: string;
  imageWidth: number;
  imageHeight: number;
  /** Visuels aux dimensions IAB exactes, par format. */
  formatImages?: Partial<Record<AdFormat, string>>;
  /** Visuels dédiés par emplacement (prioritaire sur formatImages). */
  slotImages?: Partial<Record<string, string>>;
  href: string;
  alt: string;
  sponsor?: string;
  active: boolean;
};

export type AdSlotDefinition = {
  id: string;
  label: string;
  format: AdFormat;
  /** Vide = emplacement réservé (ex. pied de page partenaire 3–10). */
  campaignId?: string;
  enabled?: boolean;
  sortOrder?: number;
};

export type AdCampaignRow = {
  id: string;
  name: string;
  image: string;
  image_width: number;
  image_height: number;
  href: string;
  alt: string;
  sponsor: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdSlotRow = {
  id: string;
  label: string;
  format: AdFormat;
  campaign_id: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export const AD_FORMAT_LABELS: Record<AdFormat, string> = {
  leaderboard: "Bandeau large",
  billboard: "Grand encart",
  rectangle: "Rectangle",
  sidebar: "Colonne latérale",
  card: "Carte (grille)",
  ribbon: "Bandeau pied de page",
};
