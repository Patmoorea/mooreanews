import { CoverPlaceholder } from "@/components/CoverPlaceholder";
import { PosterImage } from "@/components/PosterImage";
import { hasPoster } from "@/lib/has-poster";
import type { CategorySlug } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  src?: string | null;
  alt: string;
  category?: CategorySlug | string;
  slug?: string;
  className?: string;
  sizes?: string;
};

/** Vraie photo uniquement ; sinon fond neutre (jamais de stock photo hors sujet). */
export function PublicationCover({
  src,
  alt,
  className,
}: Props) {
  if (hasPoster(src)) {
    return (
      <PosterImage src={src!} alt={alt} className={cn("relative", className)} />
    );
  }

  return (
    <CoverPlaceholder
      alt={alt}
      className={className}
      label="Ajoutez une photo en admin"
    />
  );
}
