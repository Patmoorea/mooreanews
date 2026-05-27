import Image from "next/image";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  /** header = bandeau menu ; footer = version un peu plus large */
  variant?: "header" | "footer";
  className?: string;
  priority?: boolean;
};

/**
 * Bannière officielle recadrée pour le menu (hauteur fixe, partie gauche
 * avec logo + MOOREANEWS). Sur très petit écran, on masque la bannière
 * et on garde le logo seul via le Header.
 */
export function BrandBanner({
  variant = "header",
  className,
  priority = false,
}: Props) {
  const isHeader = variant === "header";

  return (
    <div
      className={cn(
        "relative overflow-hidden flex-shrink-0 rounded-lg ring-1 ring-ocean-100/80 bg-white",
        isHeader
          ? "h-9 w-[128px] sm:h-11 sm:w-[200px] md:h-12 md:w-[240px] lg:h-[52px] lg:w-[280px]"
          : "h-12 w-[220px] sm:h-14 sm:w-[280px]",
        className,
      )}
    >
      <Image
        src={SITE.banner}
        alt={`${SITE.name} — ${SITE.tagline}`}
        fill
        priority={priority}
        sizes={
          isHeader
            ? "(max-width: 640px) 128px, (max-width: 1024px) 200px, 280px"
            : "(max-width: 640px) 220px, 280px"
        }
        className={cn(
          "object-cover",
          /* Recadrage : logo + titre, sans la rangée d’icônes ni le bandeau bas */
          isHeader
            ? "object-[8%_28%] sm:object-[6%_26%] lg:object-[5%_24%]"
            : "object-[5%_22%]",
        )}
      />
    </div>
  );
}
