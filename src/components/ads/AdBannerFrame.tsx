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

/** Cadre IAB : le visuel natif est centré en entier (object-contain, jamais rogné). */
export function AdBannerFrame({ src, alt, format, className }: Props) {
  const spec = AD_FORMAT_DISPLAY[format];

  return (
    <div
      className={cn(
        "mx-auto flex w-full items-center justify-center bg-black",
        spec.maxWidthClass,
        className,
      )}
      style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
    >
      <Image
        src={src}
        alt={alt}
        width={spec.width}
        height={spec.height}
        sizes={`(max-width: 768px) 100vw, ${spec.width}px`}
        className="max-h-full max-w-full object-contain"
        priority={format === "leaderboard"}
      />
    </div>
  );
}
