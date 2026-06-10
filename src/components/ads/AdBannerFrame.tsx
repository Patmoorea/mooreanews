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

/** Cadre IAB : visuel natif aux pixels exacts, ratio verrouillé. */
export function AdBannerFrame({ src, alt, format, className }: Props) {
  const spec = AD_FORMAT_DISPLAY[format];

  return (
    <div className={cn("mx-auto w-full", spec.maxWidthClass, className)}>
      <Image
        src={src}
        alt={alt}
        width={spec.width}
        height={spec.height}
        sizes={`(max-width: 768px) 100vw, ${spec.width}px`}
        className="block h-auto w-full max-w-full"
        style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
        priority={format === "leaderboard"}
      />
    </div>
  );
}
