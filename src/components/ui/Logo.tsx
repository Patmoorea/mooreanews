import Image from "next/image";
import { SITE } from "@/lib/constants";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
  /** Logo saisonnier ou défaut SITE.logo */
  src?: string;
};

/**
 * Logo MooreaNews : image officielle (île, palmier, lagon, hibiscus,
 * motifs tribaux). Variante saisonnière si `src` fourni.
 */
export function Logo({ size = 48, className, priority = false, src }: Props) {
  return (
    <Image
      src={src ?? SITE.logo}
      alt={`${SITE.name} — ${SITE.tagline}`}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
