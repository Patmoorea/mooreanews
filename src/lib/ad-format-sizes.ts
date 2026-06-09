import type { AdFormat } from "@/lib/ads-types";

/** Dimensions d'affichage IAB (standards bannières web). */
export type AdFormatDisplay = {
  /** Nom standard */
  label: string;
  /** Ratio largeur/hauteur */
  aspect: number;
  width: number;
  height: number;
  /** Largeur max sur desktop */
  maxWidthClass: string;
  /** Recadrage si le visuel uploadé est plus grand */
  objectFit: "cover" | "contain";
  objectPosition?: string;
};

export const AD_FORMAT_DISPLAY: Record<AdFormat, AdFormatDisplay> = {
  leaderboard: {
    label: "Leaderboard 728×90",
    aspect: 728 / 90,
    width: 728,
    height: 90,
    maxWidthClass: "max-w-[728px]",
    objectFit: "cover",
    objectPosition: "center 35%",
  },
  billboard: {
    label: "Billboard 970×250",
    aspect: 970 / 250,
    width: 970,
    height: 250,
    maxWidthClass: "max-w-[970px]",
    objectFit: "cover",
    objectPosition: "center 40%",
  },
  rectangle: {
    label: "Rectangle 300×250",
    aspect: 300 / 250,
    width: 300,
    height: 250,
    maxWidthClass: "max-w-[300px]",
    objectFit: "cover",
    objectPosition: "center center",
  },
  sidebar: {
    label: "Sidebar 300×250",
    aspect: 300 / 250,
    width: 300,
    height: 250,
    maxWidthClass: "max-w-[300px]",
    objectFit: "cover",
    objectPosition: "center center",
  },
  card: {
    label: "Carte 300×200",
    aspect: 300 / 200,
    width: 300,
    height: 200,
    maxWidthClass: "max-w-full",
    objectFit: "cover",
    objectPosition: "center 35%",
  },
  ribbon: {
    label: "Bandeau 468×60",
    aspect: 468 / 60,
    width: 468,
    height: 60,
    maxWidthClass: "max-w-[468px]",
    objectFit: "cover",
    objectPosition: "center center",
  },
};
