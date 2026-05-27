"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveCoverImage } from "@/lib/cover-image";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt: string;
  category?: string;
  slug?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
  overlay?: boolean;
  children?: React.ReactNode;
};

/**
 * Affiche la couverture d’une publication (URL admin, JSON ou image par défaut).
 */
export function ContentCoverImage({
  src,
  alt,
  category,
  slug,
  className,
  imageClassName,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  overlay = true,
  children,
}: Props) {
  const primary = resolveCoverImage({ image: src, category, slug });
  const fallback = resolveCoverImage({ category, slug });
  const [activeSrc, setActiveSrc] = useState(primary);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-lagon-200 via-tipanier-200 to-soleil-200",
        className
      )}
    >
      <Image
        src={activeSrc}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
        onError={() => {
          if (activeSrc !== fallback) setActiveSrc(fallback);
        }}
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none"
          aria-hidden
        />
      )}
      {children}
    </div>
  );
}
