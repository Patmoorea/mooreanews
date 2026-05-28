import { cn } from "@/lib/utils";

type DecorProps = {
  className?: string;
  flip?: boolean;
};

/** Vague décorative en bas de section (statique) */
export function WaveDivider({ className, flip }: DecorProps) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden leading-[0] text-lagon-200/80",
        flip && "rotate-180",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        className="w-full h-8 sm:h-10 md:h-12"
      >
        <path
          fill="currentColor"
          d="M0,32 C120,48 240,16 360,28 C480,40 600,8 720,24 C840,40 960,12 1080,28 C1200,44 1320,20 1440,32 L1440,48 L0,48 Z"
        />
        <path
          fill="currentColor"
          opacity="0.5"
          d="M0,36 C180,52 360,20 540,32 C720,44 900,16 1080,28 C1260,40 1350,32 1440,36 L1440,48 L0,48 Z"
        />
      </svg>
    </div>
  );
}

/** Fond de section chaleureux sans éléments animés */
export function TropicalSection({
  children,
  className,
  warm = false,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  warm?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={cn(
        "relative",
        warm
          ? "bg-gradient-to-b from-soleil-50/80 via-lagon-50 to-ocean-50"
          : "bg-gradient-to-b from-lagon-50/60 via-ocean-50 to-white",
        className,
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lagon-300/50 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Petites icônes tropicales pour titres */
export const TROPICAL_EMOJI = {
  welcome: "🌺",
  island: "🏝️",
  palm: "🌴",
  sun: "☀️",
  wave: "🌊",
  shell: "🐚",
} as const;
