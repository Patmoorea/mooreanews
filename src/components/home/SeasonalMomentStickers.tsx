"use client";

import {
  CalendarDays,
  Gift,
  Music2,
  Sparkles,
  Trophy,
  Waves,
  type LucideIcon,
} from "lucide-react";
import {
  HERO_STICKER_ACCENTS,
  HeroStickerVignette,
} from "@/components/home/HeroStickerVignette";
import {
  getActiveSeasonalMoments,
  type SeasonalMoment,
  type SeasonalMomentIcon,
} from "@/lib/seasonal-moments";

const ICONS: Record<SeasonalMomentIcon, LucideIcon> = {
  trophy: Trophy,
  music: Music2,
  gift: Gift,
  sparkles: Sparkles,
  waves: Waves,
  calendar: CalendarDays,
};

const ACCENTS: Record<SeasonalMoment["accent"], string> = {
  sport: "from-soleil-400/35 to-couchant/30",
  heiva: "from-fuchsia-400/30 to-soleil-500/25",
  fetes: "from-emerald-400/25 to-soleil-400/30",
  ocean: "from-lagon-400/30 to-lagon-600/20",
  agenda: HERO_STICKER_ACCENTS.agenda,
};

/** Pastilles hero — grands événements de la saison (Heiva, Coupe du monde, Noël…). */
export function SeasonalMomentStickers() {
  const moments = getActiveSeasonalMoments(2);
  if (moments.length === 0) return null;

  return (
    <>
      {moments.map((moment) => {
        const Icon = ICONS[moment.icon];
        return (
          <HeroStickerVignette
            key={moment.id}
            href={moment.href}
            label={moment.label}
            icon={Icon}
            accent={ACCENTS[moment.accent]}
            isFresh
          />
        );
      })}
    </>
  );
}
