import {
  getSeasonThemeMeta,
  type SeasonThemeId,
} from "@/lib/seasonal-theme";
import { SeasonThemeIcon } from "@/components/decor/SeasonThemeIllustrations";
import { cn } from "@/lib/utils";

type Props = {
  theme: SeasonThemeId | null;
};

const FLOATERS: {
  top: string;
  left?: string;
  right?: string;
  size: number;
  delay: string;
  duration: string;
  rotate?: string;
}[] = [
  { top: "6%", left: "2%", size: 56, delay: "0s", duration: "22s", rotate: "-12deg" },
  { top: "14%", right: "3%", size: 72, delay: "2s", duration: "26s", rotate: "8deg" },
  { top: "42%", left: "1%", size: 48, delay: "4s", duration: "24s", rotate: "6deg" },
  { top: "58%", right: "2%", size: 64, delay: "1s", duration: "28s", rotate: "-6deg" },
  { top: "78%", left: "4%", size: 52, delay: "3s", duration: "25s", rotate: "10deg" },
  { top: "88%", right: "5%", size: 44, delay: "5s", duration: "20s", rotate: "-8deg" },
];

/** Illustrations & icônes thématiques visibles — Coupe du monde, Noël, Hawaiki… */
export function SeasonalDecor({ theme }: Props) {
  const meta = getSeasonThemeMeta(theme);
  if (!theme || !meta) return null;

  return (
    <div
      className="season-deco-layer pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {/* Grande illustration — coin bas droit */}
      <div className="absolute -bottom-4 -right-2 sm:bottom-2 sm:right-2 opacity-[0.2] sm:opacity-[0.26]">
        <SeasonThemeIcon theme={theme} size={200} className="season-deco-hero hidden sm:block" />
        <SeasonThemeIcon theme={theme} size={140} className="season-deco-hero sm:hidden" />
      </div>

      {/* Illustration secondaire — coin haut gauche */}
      <div className="absolute top-16 left-0 opacity-[0.14] sm:top-20 sm:opacity-[0.18]">
        <SeasonThemeIcon theme={theme} size={110} className="season-deco-hero hidden md:block" />
      </div>

      {/* Icônes flottantes répétées */}
      {FLOATERS.map((slot, i) => (
        <div
          key={`${theme}-float-${i}`}
          className={cn("season-deco-float absolute opacity-[0.14] sm:opacity-[0.2]")}
          style={{
            top: slot.top,
            left: slot.left,
            right: slot.right,
            animationDelay: slot.delay,
            animationDuration: slot.duration,
            transform: `rotate(${slot.rotate ?? "0deg"})`,
          }}
        >
          <SeasonThemeIcon theme={theme} size={slot.size} />
        </div>
      ))}
    </div>
  );
}
