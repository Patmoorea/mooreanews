"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Affiche / flyer — img natif pour fiabilité (Supabase, local, Facebook…). */
export function PosterImage({ src, alt, className }: Props) {
  const [failed, setFailed] = useState(false);
  if (failed || !src.trim()) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-sm flex items-center justify-center",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src.trim()}
        alt={alt}
        className="w-full h-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
