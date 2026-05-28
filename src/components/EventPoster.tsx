import Image from "next/image";
import { isPlaceholderContentImage } from "@/lib/cover-image";
import { cn } from "@/lib/utils";

export function hasEventPoster(image?: string | null): boolean {
  return !!image?.trim() && !isPlaceholderContentImage(image);
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/** Affiche événement (flyer) — object-contain pour ne pas rogner le texte. */
export function EventPoster({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 40vw, 200px",
  priority = false,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-sm",
        className,
      )}
    >
      <Image
        src={src.trim()}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-contain p-1"
      />
    </div>
  );
}
