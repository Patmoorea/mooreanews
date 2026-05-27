import Image from "next/image";
import { SITE } from "@/lib/constants";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/**
 * Logo MooreaNews : image officielle (île, palmier, lagon, hibiscus,
 * motifs tribaux). Le PNG source est rond, on conserve simplement
 * sa forme circulaire native.
 */
export function Logo({ size = 48, className, priority = false }: Props) {
  return (
    <Image
      src={SITE.logo}
      alt={`${SITE.name} — ${SITE.tagline}`}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
