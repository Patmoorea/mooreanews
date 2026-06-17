import type { ComponentType, ReactNode } from "react";
import type { SeasonThemeId } from "@/lib/seasonal-theme";
import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  size?: number;
};

function SvgWrap({
  size = 48,
  className,
  children,
  viewBox = "0 0 48 48",
}: {
  size?: number;
  className?: string;
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={className}
      aria-hidden
      fill="none"
    >
      {children}
    </svg>
  );
}

function CoupeMondeIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <circle cx="24" cy="24" r="20" fill="#fefce8" stroke="#16a34a" strokeWidth="2" />
      <path
        d="M24 8 L28 18 L38 18 L30 24 L33 34 L24 28 L15 34 L18 24 L10 18 L20 18 Z"
        fill="#16a34a"
        opacity="0.85"
      />
      <path
        d="M24 14 L26 20 L32 20 L27 24 L29 30 L24 26 L19 30 L21 24 L16 20 L22 20 Z"
        fill="#eab308"
      />
      <circle cx="24" cy="24" r="3" fill="#15803d" />
    </SvgWrap>
  );
}

function HeivaIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <circle cx="24" cy="20" r="10" fill="#fdf4ff" stroke="#c026d3" strokeWidth="1.5" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <ellipse
          key={deg}
          cx="24"
          cy="20"
          rx="14"
          ry="5"
          fill="#e879f9"
          opacity="0.7"
          transform={`rotate(${deg} 24 20)`}
        />
      ))}
      <circle cx="24" cy="20" r="4" fill="#fbbf24" />
      <rect x="20" y="30" width="8" height="12" rx="2" fill="#78350f" />
      <ellipse cx="24" cy="30" rx="10" ry="3" fill="#92400e" opacity="0.6" />
    </SvgWrap>
  );
}

function HawaikiIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className} viewBox="0 0 64 40">
      <path
        d="M4 28 Q32 12 60 28"
        stroke="#0284c7"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M8 26 L56 26 L52 30 L12 30 Z" fill="#ea580c" />
      <path d="M32 26 V14" stroke="#78350f" strokeWidth="2" />
      <ellipse cx="32" cy="32" rx="22" ry="4" fill="#0ea5e9" opacity="0.35" />
      <path d="M10 30 L6 34 L14 34 Z" fill="#fb923c" />
      <path d="M54 30 L50 34 L58 34 Z" fill="#fb923c" />
    </SvgWrap>
  );
}

function NoelIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path d="M24 6 L38 38 H10 Z" fill="#15803d" />
      <path d="M24 12 L34 34 H14 Z" fill="#22c55e" />
      <path d="M24 18 L30 32 H18 Z" fill="#16a34a" />
      <rect x="20" y="36" width="8" height="6" rx="1" fill="#78350f" />
      <path
        d="M24 4 L25 8 L24 6 L23 8 Z"
        fill="#eab308"
      />
      <circle cx="18" cy="26" r="2" fill="#dc2626" />
      <circle cx="30" cy="22" r="2" fill="#eab308" />
      <circle cx="26" cy="30" r="2" fill="#3b82f6" />
    </SvgWrap>
  );
}

function NouvelAnIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <circle cx="24" cy="24" r="4" fill="#eab308" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="24"
          y1="24"
          x2="24"
          y2="8"
          stroke="#ca8a04"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <circle cx="12" cy="14" r="2" fill="#a855f7" opacity="0.8" />
      <circle cx="36" cy="16" r="1.5" fill="#ec4899" />
      <circle cx="34" cy="34" r="2" fill="#fbbf24" opacity="0.8" />
    </SvgWrap>
  );
}

function FeteMusiqueIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <circle cx="16" cy="34" r="8" stroke="#9333ea" strokeWidth="2" fill="#faf5ff" />
      <path
        d="M24 34 V12 L38 8 V28"
        stroke="#ec4899"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="38" cy="28" r="5" stroke="#9333ea" strokeWidth="2" fill="#fdf4ff" />
      <path d="M8 18 Q12 14 16 18 T24 18" stroke="#a855f7" strokeWidth="1.5" fill="none" />
    </SvgWrap>
  );
}

function TricolorIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className} viewBox="0 0 36 48">
      <rect width="12" height="48" fill="#2563eb" rx="2" />
      <rect x="12" width="12" height="48" fill="#ffffff" />
      <rect x="24" width="12" height="48" fill="#dc2626" rx="2" />
    </SvgWrap>
  );
}

function PaquesIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <ellipse cx="24" cy="28" rx="14" ry="18" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
      <path
        d="M16 20 Q24 10 32 20"
        stroke="#fb923c"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="20" cy="24" r="2" fill="#f472b6" />
      <circle cx="28" cy="26" r="2" fill="#60a5fa" />
      <circle cx="24" cy="32" r="2" fill="#4ade80" />
    </SvgWrap>
  );
}

function ToussaintIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <circle cx="24" cy="24" r="8" fill="#fecdd3" stroke="#78716c" strokeWidth="1.5" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="24"
          cy="24"
          rx="12"
          ry="4"
          fill="#fda4af"
          opacity="0.8"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="3" fill="#78716c" />
    </SvgWrap>
  );
}

function BaleinesIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className} viewBox="0 0 56 32">
      <path
        d="M4 20 Q16 8 28 14 Q40 20 52 14"
        stroke="#0284c7"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M48 14 L52 10 L52 18 Z" fill="#0284c7" />
      <circle cx="20" cy="16" r="2" fill="#0369a1" />
      <path d="M8 22 Q4 18 6 14" stroke="#0ea5e9" strokeWidth="1.5" fill="none" />
    </SvgWrap>
  );
}

function TrailIcon({ className, size = 48 }: IconProps) {
  return (
    <SvgWrap size={size} className={className}>
      <path
        d="M8 36 L18 22 L28 28 L40 12"
        stroke="#059669"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="12" r="4" fill="#78350f" />
      <path d="M36 8 L40 4 L44 8" stroke="#059669" strokeWidth="1.5" fill="none" />
    </SvgWrap>
  );
}

const ICONS: Record<SeasonThemeId, ComponentType<IconProps>> = {
  "coupe-monde": CoupeMondeIcon,
  heiva: HeivaIcon,
  "hawaiki-nui": HawaikiIcon,
  noel: NoelIcon,
  "nouvel-an": NouvelAnIcon,
  "fete-musique": FeteMusiqueIcon,
  "fete-autonomie": TricolorIcon,
  "juillet-14": TricolorIcon,
  paques: PaquesIcon,
  toussaint: ToussaintIcon,
  baleines: BaleinesIcon,
  xterra: TrailIcon,
  "matiti-run": TrailIcon,
};

/** Icône thématique reconnaissable (ballon, pirogue, sapin…). */
export function SeasonThemeIcon({
  theme,
  className,
  size = 48,
}: {
  theme: SeasonThemeId;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[theme];
  return <Icon className={className} size={size} />;
}

/** Grande illustration d’ambiance (coin de page). */
export function SeasonThemeHeroArt({
  theme,
  className,
  size = 160,
}: {
  theme: SeasonThemeId;
  className?: string;
  size?: number;
}) {
  return (
    <SeasonThemeIcon
      theme={theme}
      size={size}
      className={cn("drop-shadow-sm", className)}
    />
  );
}
