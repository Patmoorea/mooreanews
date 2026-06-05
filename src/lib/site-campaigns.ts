/**
 * Campagnes mises en avant sur l’accueil (affiches institutionnelles, sensibilisation…).
 */

export type SiteCampaign = {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAlt: string;
  highlights: { icon: "route" | "ocean" | "heart"; text: string }[];
  /** Masquage auto après cette date (heure Tahiti, fin de journée). */
  until?: string;
};

const RENTREZ_VIVANTS: SiteCampaign = {
  id: "rentrez-vivants-tahiti-2026",
  title: "Rentrez vivants.",
  subtitle:
    "Campagne de sensibilisation pour les jeunes de Tahiti et Moorea — route et océan.",
  imageSrc: "/images/campaigns/rentrez-vivants-tahiti-2026.png",
  imageAlt:
    "Affiche : La route n’est pas un circuit, l’océan n’est pas un jeu — Rentrez vivants.",
  highlights: [
    {
      icon: "route",
      text: "La route n’est pas un circuit — ralentissez.",
    },
    {
      icon: "ocean",
      text: "L’océan n’est pas un jeu — réfléchissez avant de partir.",
    },
    {
      icon: "heart",
      text: "Derrière chaque victime, une famille qui souffre.",
    },
  ],
  until: "2026-12-31",
};

export function getActiveSiteCampaign(): SiteCampaign | null {
  if (process.env.NEXT_PUBLIC_SAFETY_CAMPAIGN_ENABLED === "false") {
    return null;
  }

  const campaign = RENTREZ_VIVANTS;
  if (campaign.until) {
    const end = new Date(`${campaign.until}T23:59:59-10:00`);
    if (Date.now() > end.getTime()) return null;
  }

  return campaign;
}
