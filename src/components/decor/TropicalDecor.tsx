import { cn } from "@/lib/utils";

type DecorProps = {
  className?: string;
};

/** Silhouette de cocotier (gauche) */
export function PalmLeft({ className }: DecorProps) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-tipanier-600/25", className)}
      aria-hidden
    >
      <path
        d="M58 200V95c-18-2-32-14-38-32 8 6 18 10 28 10 4-22 14-40 32-52-4 18-2 36 6 52 10-8 22-12 34-10-12-14-18-32-16-50 14 16 24 36 26 58 8-4 16-6 24-6-10 14-16 30-16 48 6-8 14-12 22-12V200H58z"
        fill="currentColor"
      />
      <ellipse cx="58" cy="88" rx="8" ry="12" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** Silhouette de cocotier (droite, miroir) */
export function PalmRight({ className }: DecorProps) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-tipanier-700/20", className)}
      aria-hidden
    >
      <path
        d="M58 200V95c-18-2-32-14-38-32 8 6 18 10 28 10 4-22 14-40 32-52-4 18-2 36 6 52 10-8 22-12 34-10-12-14-18-32-16-50 14 16 24 36 26 58 8-4 16-6 24-6-10 14-16 30-16 48 6-8 14-12 22-12V200H58z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Vague décorative en bas de section */
export function WaveDivider({ className, flip }: DecorProps & { flip?: boolean }) {
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

/** Hibiscus stylisé */
export function Hibiscus({ className }: DecorProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("text-tiare-400/40", className)}
      aria-hidden
    >
      <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.8" />
      {[0, 72, 144, 216, 288].map((rot) => (
        <ellipse
          key={rot}
          cx="24"
          cy="14"
          rx="7"
          ry="12"
          fill="currentColor"
          transform={`rotate(${rot} 24 24)`}
        />
      ))}
    </svg>
  );
}

/** Ambiance : palmiers + fleurs flottantes autour d'une section */
export function TropicalAmbient({
  children,
  className,
  palms = true,
  warm = false,
}: {
  children: React.ReactNode;
  className?: string;
  palms?: boolean;
  warm?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        warm
          ? "bg-gradient-to-b from-soleil-50/80 via-lagon-50 to-ocean-50"
          : "bg-gradient-to-b from-lagon-50/60 via-ocean-50 to-white",
        className,
      )}
    >
      {palms && (
        <>
          <PalmLeft className="absolute -left-2 bottom-0 w-24 sm:w-32 lg:w-40 h-auto pointer-events-none animate-sway hidden sm:block" />
          <PalmRight className="absolute -right-2 bottom-0 w-28 sm:w-36 lg:w-44 h-auto pointer-events-none animate-sway-delayed hidden sm:block" />
        </>
      )}
      <Hibiscus className="absolute top-8 right-[12%] w-10 h-10 animate-float opacity-60 hidden md:block" />
      <Hibiscus className="absolute top-16 left-[8%] w-8 h-8 animate-float opacity-40 hidden lg:block [animation-delay:2s]" />
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
