import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PosterImage, hasPoster } from "@/components/PosterImage";
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

/** Affiche réelle si présente, sinon image de secours par catégorie. */
export function PublicationCover({
  src,
  alt,
  category,
  slug,
  className,
  sizes,
}: Props) {
  if (hasPoster(src)) {
    return (
      <PosterImage src={src!} alt={alt} className={cn("relative", className)} />
    );
  }

  return (
    <ContentCoverImage
      src={src}
      alt={alt}
      category={category}
      slug={slug}
      className={className}
      sizes={sizes}
    />
  );
}
