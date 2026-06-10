import Image from "next/image";
import { cn } from "@/lib/utils";
import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";
import type { AdFormat } from "@/lib/ads-types";

type Props = {
  src: string;
  alt: string;
  format: AdFormat;
  className?: string;
};

/** Cadre IAB verrouillé — visuels aux dimensions exactes, remplissage object-cover. */
export function AdBannerFrame({ src, alt, format, className }: Props) {
  const spec = AD_FORMAT_DISPLAY[format];

  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden bg-ocean-950/5",
        spec.maxWidthClass,
        className,
      )}
      style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`(max-width: 768px) 100vw, ${spec.width}px`}
        className={cn(
          spec.objectFit === "cover" ? "object-cover" : "object-contain",
        )}
        style={
          spec.objectPosition
            ? { objectPosition: spec.objectPosition }
            : undefined
        }
        priority={format === "leaderboard"}
      />
    </div>
  );
}
