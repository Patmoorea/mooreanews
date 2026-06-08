"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dégradés discrets — même famille que les tuiles utilitaires du hero. */
export const HERO_STICKER_ACCENTS = {
  garde: "from-tiare-400/30 to-tiare-600/25",
  agenda: "from-lagon-400/30 to-lagon-600/20",
  emploi: "from-soleil-400/30 to-soleil-600/20",
  coupure: "from-couchant/40 to-tiare-600/25",
  coupureCalm: "from-couchant/30 to-soleil-600/20",
} as const;

type Props = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  isFresh?: boolean;
  pulse?: boolean;
  className?: string;
};

/** Mini-vignette hero (garde, agenda, emploi…) — verre + teinte douce. */
export function HeroStickerVignette({
  href,
  label,
  icon: Icon,
  accent,
  isFresh,
  pulse,
  className,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex items-center gap-2.5 max-w-[min(100%,22rem)] min-h-[3.25rem] px-3.5 py-2 rounded-2xl",
        "border border-white/25 bg-white/12 backdrop-blur-md",
        "hover:bg-white/22 hover:border-white/40 hover:-translate-y-0.5",
        "transition-all duration-200",
        isFresh && "ring-1 ring-white/35",
        pulse && "animate-pulse",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-60",
          accent,
        )}
      />
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
        <Icon size={18} strokeWidth={2} aria-hidden />
      </span>
      <span className="relative truncate text-white text-[11px] sm:text-xs font-semibold leading-snug">
        {label}
      </span>
    </Link>
  );
}
