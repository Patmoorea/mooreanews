/**
 * Grands moments de l’année — pastilles hero (dates Tahiti).
 * Mettre à jour les plages chaque année (Coupe du monde, Heiva, Noël…).
 */

export type SeasonalMomentIcon =
  | "trophy"
  | "music"
  | "gift"
  | "sparkles"
  | "waves"
  | "calendar";

export type SeasonalMoment = {
  id: string;
  /** Plus élevé = affiché en premier si plusieurs actifs. */
  priority: number;
  start: string;
  end: string;
  label: string;
  href: string;
  icon: SeasonalMomentIcon;
  accent: "sport" | "heiva" | "fetes" | "ocean" | "agenda";
};

/** Aujourd’hui en YYYY-MM-DD (heure Tahiti). */
export function tahitiDateIso(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isSeasonalMomentActive(
  moment: Pick<SeasonalMoment, "start" | "end">,
  today = tahitiDateIso(),
): boolean {
  return today >= moment.start && today <= moment.end;
}

/** Calendrier des temps forts — ajuster les dates chaque saison. */
export const SEASONAL_MOMENTS: SeasonalMoment[] = [
  {
    id: "coupe-monde-2026",
    priority: 90,
    start: "2026-06-01",
    end: "2026-07-20",
    label: "Coupe du monde 2026 — actu & retransmissions",
    href: "/evenements",
    icon: "trophy",
    accent: "sport",
  },
  {
    id: "heiva-2026",
    priority: 85,
    start: "2026-06-20",
    end: "2026-07-31",
    label: "Heiva i Moorea — danse, musique & culture",
    href: "/evenements/heiva-i-moorea-2026",
    icon: "music",
    accent: "heiva",
  },
  {
    id: "baleines-2026",
    priority: 40,
    start: "2026-08-01",
    end: "2026-11-15",
    label: "Saison baleines — sorties & respect en mer",
    href: "/activites",
    icon: "waves",
    accent: "ocean",
  },
  {
    id: "xterra-2026",
    priority: 45,
    start: "2026-10-01",
    end: "2026-10-31",
    label: "XTERRA Moorea — trail & triathlon",
    href: "/evenements",
    icon: "trophy",
    accent: "sport",
  },
  {
    id: "noel-2026",
    priority: 80,
    start: "2026-12-01",
    end: "2026-12-26",
    label: "Noël à Moorea — marchés, concerts & familles",
    href: "/evenements",
    icon: "gift",
    accent: "fetes",
  },
  {
    id: "nouvel-an-2027",
    priority: 75,
    start: "2026-12-28",
    end: "2027-01-05",
    label: "Nouvel An & Tūrai — vœux & fêtes",
    href: "/evenements",
    icon: "sparkles",
    accent: "fetes",
  },
];

export function getActiveSeasonalMoments(
  limit = 2,
  today = tahitiDateIso(),
): SeasonalMoment[] {
  if (process.env.NEXT_PUBLIC_SEASONAL_MOMENTS_ENABLED === "false") {
    return [];
  }

  return SEASONAL_MOMENTS.filter((m) => isSeasonalMomentActive(m, today))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}
