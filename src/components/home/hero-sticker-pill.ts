/** Style verre des pastilles hero (aligné météo / Ia ora na, plus transparent). */
export const HERO_PILL_GLASS =
  "rounded-full backdrop-blur-lg border text-white text-[11px] sm:text-xs font-semibold transition-colors";

export function heroPillSurface(isFresh = false): string {
  return isFresh
    ? "bg-white/10 border-white/50 hover:bg-white/16 ring-1 ring-white/25"
    : "bg-white/[0.06] border-white/45 hover:bg-white/12";
}
