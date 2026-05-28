"use client";

import Image from "next/image";
import { useState } from "react";
import { CoverPlaceholder } from "@/components/CoverPlaceholder";
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
  placeholderLabel?: string;
  children?: React.ReactNode;
};

/**
 * Affiche la couverture seulement si une vraie image existe (admin / upload).
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
  placeholderLabel = "Photo à venir",
  children,
}: Props) {
  const resolved = resolveCoverImage({ image: src, category, slug });
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return (
      <CoverPlaceholder
        alt={alt}
        className={className}
        label={placeholderLabel}
      />
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-ocean-100", className)}
    >
      <Image
        src={resolved}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imageClassName)}
        onError={() => setFailed(true)}
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
