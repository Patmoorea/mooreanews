"use client";

import Image from "next/image";
import { useState } from "react";
import { CoverPlaceholder } from "@/components/CoverPlaceholder";
import {
  isPosterStyleCover,
  resolveCoverImage,
} from "@/lib/cover-image";
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
  /** cover = recadrage bannière ; contain = affiche entière (auto pour Facebook). */
  fit?: "cover" | "contain";
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
  fit,
  children,
}: Props) {
  const resolved = resolveCoverImage({ image: src, category, slug });
  const [failed, setFailed] = useState(false);
  const imageFit =
    fit ?? (isPosterStyleCover({ image: src, slug }) ? "contain" : "cover");

  if (!resolved || failed) {
    return (
      <CoverPlaceholder
        alt={alt}
        className={className}
        label={placeholderLabel}
      />
    );
  }

  if (imageFit === "contain") {
    const boxed = /\baspect-/.test(className ?? "");

    if (boxed) {
      return (
        <div
          className={cn(
            "relative overflow-hidden bg-ocean-50",
            className,
          )}
        >
          <Image
            src={resolved}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className={cn("object-contain", imageClassName)}
            onError={() => setFailed(true)}
          />
          {overlay && (
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none"
              aria-hidden
            />
          )}
          {children}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "relative overflow-hidden bg-ocean-50 flex items-center justify-center",
          className,
        )}
      >
        <Image
          src={resolved}
          alt={alt}
          width={1200}
          height={1600}
          priority={priority}
          sizes={sizes}
          className={cn(
            "w-full h-auto max-h-[min(85vh,960px)] object-contain",
            imageClassName,
          )}
          onError={() => setFailed(true)}
        />
        {overlay && (
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"
            aria-hidden
          />
        )}
        {children}
      </div>
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
