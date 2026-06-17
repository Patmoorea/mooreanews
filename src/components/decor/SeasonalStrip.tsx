import Image from "next/image";
import type { ActiveSeasonalTheme } from "@/lib/seasonal-theme";

type Props = {
  theme: ActiveSeasonalTheme;
};

/** Bandeau saisonnier fin sous le header (675×~60 px). */
export function SeasonalStrip({ theme }: Props) {
  const banner = theme.assets.banner;
  if (!banner) return null;

  return (
    <div
      className="relative w-full overflow-hidden border-b border-ocean-100/80 bg-ocean-950"
      role="img"
      aria-label={`Thème ${theme.label}`}
    >
      <Image
        src={banner}
        alt=""
        width={1920}
        height={80}
        className="h-12 sm:h-14 w-full object-cover object-center"
        sizes="100vw"
        priority={false}
      />
    </div>
  );
}
