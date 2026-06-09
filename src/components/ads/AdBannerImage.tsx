import Image from "next/image";
import { cn } from "@/lib/utils";

export function AdBannerImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={cn("w-full h-auto block", className)}
    />
  );
}
