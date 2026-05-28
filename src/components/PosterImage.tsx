import { isPlaceholderContentImage } from "@/lib/cover-image";
import { cn } from "@/lib/utils";

export function hasPoster(image?: string | null): boolean {
  return !!image?.trim() && !isPlaceholderContentImage(image);
}

type Props = {
  src: string;
  alt: string;
  className?: string;
};

/** Affiche / flyer — img natif pour fiabilité (Supabase, local, Facebook…). */
export function PosterImage({ src, alt, className }: Props) {
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
      />
    </div>
  );
}
