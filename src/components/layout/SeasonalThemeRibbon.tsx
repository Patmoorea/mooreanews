import {
  getSeasonThemeMeta,
  type SeasonThemeId,
} from "@/lib/seasonal-theme-meta";
import { SeasonThemeIcon } from "@/components/decor/SeasonThemeIllustrations";

type Props = {
  theme: SeasonThemeId;
};

/** Bandeau visuel sous le header — rappelle l’événement en cours (sans lien). */
export function SeasonalThemeRibbon({ theme }: Props) {
  const meta = getSeasonThemeMeta(theme);
  if (!meta) return null;

  return (
    <div
      className={`season-ribbon season-ribbon--${theme} relative z-40 border-b`}
      role="img"
      aria-label={`Ambiance ${meta.label}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 py-1.5 sm:gap-3 sm:py-2">
        <SeasonThemeIcon theme={theme} size={28} className="shrink-0 sm:hidden" />
        <SeasonThemeIcon theme={theme} size={34} className="hidden shrink-0 sm:block" />
        <span className="season-ribbon-label text-xs font-semibold tracking-wide sm:text-sm">
          {meta.label}
        </span>
        <SeasonThemeIcon
          theme={theme}
          size={22}
          className="hidden shrink-0 opacity-60 md:block"
        />
      </div>
    </div>
  );
}
