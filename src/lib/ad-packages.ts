/**
 * Forfaits publicitaires MooreaNews — règles commerciales et techniques unifiées.
 */

import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";
import type { AdCampaign, AdFormat, AdSlotDefinition } from "@/lib/ads-types";
import { FOOTER_SPONSOR_SLOT_PREFIX } from "@/lib/ads-sponsors";

export type AdPackageId = "essentiel" | "cible" | "premium";

export const AD_PACKAGE_IDS: AdPackageId[] = ["essentiel", "cible", "premium"];

export type AdPackageDefinition = {
  id: AdPackageId;
  name: string;
  tagline: string;
  fromXpf: string;
  /** Formats IAB à fournir (sidebar = même fichier que rectangle). */
  formats: AdFormat[];
  /** Emplacements page inclus (hors rubans pied de page). */
  pageSlotIds: readonly string[];
  highlights: readonly string[];
};

/** Emplacements vendus à l’unité (grille /partenaires). */
export type AdPlacementCatalogRow = {
  id: string;
  label: string;
  format: AdFormat;
  dimensions: string;
  zone: string;
  fromXpf: string;
  packages: readonly AdPackageId[];
};

const PAGE_SLOT_IDS = [
  "home-leaderboard",
  "home-articles",
  "home-events",
  "home-map",
  "actualites-top",
  "actualites-inline",
  "article-bottom",
  "restaurants-top",
  "restaurants-inline",
  "evenements-top",
  "visiteurs-mid",
  "sante-garde-mid",
] as const;

export const AD_PACKAGES: Record<AdPackageId, AdPackageDefinition> = {
  essentiel: {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Présence continue, toutes pages",
    fromXpf: "15 000",
    formats: ["ribbon"],
    pageSlotIds: [],
    highlights: [
      "1 ruban pied de page (468×60) — toutes les pages",
      "1 bannière à fournir",
      "Idéal commerce de proximité, association",
    ],
  },
  cible: {
    id: "cible",
    name: "Ciblé",
    tagline: "Pages thématiques + ruban",
    fromXpf: "25 000",
    formats: ["leaderboard", "ribbon"],
    pageSlotIds: [
      "visiteurs-mid",
      "sante-garde-mid",
      "actualites-top",
      "restaurants-top",
    ],
    highlights: [
      "Bandeau 728×90 sur pages à forte intention (visiteurs, santé, actus…)",
      "Ruban pied de page (468×60)",
      "2 bannières à fournir — mêmes règles pour tous les annonceurs",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Visibilité île entière",
    fromXpf: "45 000",
    formats: ["leaderboard", "billboard", "rectangle", "card", "ribbon"],
    pageSlotIds: PAGE_SLOT_IDS,
    highlights: [
      "Accueil, actualités, restaurants, événements, visiteurs, articles",
      "5 formats IAB (5 bannières distinctes)",
      "Ruban pied de page + rotation sur les encarts principaux",
      "Mêmes conditions pour tous les partenaires Premium",
    ],
  },
};

export const AD_PLACEMENT_CATALOG: AdPlacementCatalogRow[] = [
  {
    id: "home-leaderboard",
    label: "Accueil — bandeau principal",
    format: "leaderboard",
    dimensions: "728×90",
    zone: "Sous le hero",
    fromXpf: "35 000",
    packages: ["premium"],
  },
  {
    id: "home-articles",
    label: "Accueil — grand encart",
    format: "billboard",
    dimensions: "970×250",
    zone: "Entre actualités et événements",
    fromXpf: "30 000",
    packages: ["premium"],
  },
  {
    id: "home-events",
    label: "Accueil — rectangle agenda",
    format: "rectangle",
    dimensions: "300×250",
    zone: "Après l’agenda",
    fromXpf: "22 000",
    packages: ["premium"],
  },
  {
    id: "home-map",
    label: "Accueil — encart carte",
    format: "billboard",
    dimensions: "970×250",
    zone: "Avant la carte interactive",
    fromXpf: "28 000",
    packages: ["premium"],
  },
  {
    id: "actualites-top",
    label: "Actualités — haut de liste",
    format: "leaderboard",
    dimensions: "728×90",
    zone: "Page /actualites",
    fromXpf: "25 000",
    packages: ["premium", "cible"],
  },
  {
    id: "actualites-inline",
    label: "Actualités — encart grille",
    format: "card",
    dimensions: "300×200",
    zone: "Dans la liste d’articles",
    fromXpf: "20 000",
    packages: ["premium"],
  },
  {
    id: "article-bottom",
    label: "Article — sous le contenu",
    format: "billboard",
    dimensions: "970×250",
    zone: "Fin de chaque article",
    fromXpf: "25 000",
    packages: ["premium"],
  },
  {
    id: "restaurants-top",
    label: "Restaurants — haut de page",
    format: "leaderboard",
    dimensions: "728×90",
    zone: "Page /restaurants",
    fromXpf: "25 000",
    packages: ["premium", "cible"],
  },
  {
    id: "restaurants-inline",
    label: "Restaurants — encart liste",
    format: "rectangle",
    dimensions: "300×250",
    zone: "Dans la liste",
    fromXpf: "20 000",
    packages: ["premium"],
  },
  {
    id: "evenements-top",
    label: "Événements — haut de page",
    format: "billboard",
    dimensions: "970×250",
    zone: "Page /evenements",
    fromXpf: "28 000",
    packages: ["premium"],
  },
  {
    id: "visiteurs-mid",
    label: "Visiteurs — bandeau",
    format: "leaderboard",
    dimensions: "728×90",
    zone: "Page /visiteurs",
    fromXpf: "25 000",
    packages: ["premium", "cible"],
  },
  {
    id: "sante-garde-mid",
    label: "Santé / garde — bandeau",
    format: "leaderboard",
    dimensions: "728×90",
    zone: "Page /sante-garde",
    fromXpf: "25 000",
    packages: ["premium", "cible"],
  },
  {
    id: "footer-sponsors",
    label: "Pied de page — ruban partenaire",
    format: "ribbon",
    dimensions: "468×60",
    zone: "Toutes les pages (1 ruban / partenaire actif)",
    fromXpf: "15 000",
    packages: ["essentiel", "cible", "premium"],
  },
];

export function getAdPackage(id: AdPackageId | string | null | undefined): AdPackageDefinition {
  if (id && id in AD_PACKAGES) return AD_PACKAGES[id as AdPackageId];
  return AD_PACKAGES.cible;
}

/** Formats à téléverser pour un forfait (sidebar exclu — doublon rectangle). */
export function formatsForPackage(packageId: AdPackageId | string | null | undefined): AdFormat[] {
  return getAdPackage(packageId).formats.filter((f) => f !== "sidebar");
}

export function formatDimensionsLabel(format: AdFormat): string {
  const spec = AD_FORMAT_DISPLAY[format];
  return `${spec.width}×${spec.height}`;
}

export function packageFormatLabels(packageId: AdPackageId | string | null | undefined): string[] {
  return formatsForPackage(packageId).map(
    (f) => `${AD_FORMAT_DISPLAY[f].label} (${formatDimensionsLabel(f)})`,
  );
}

/** Libellés des emplacements page + pied de page inclus dans un forfait. */
export function packagePlacementLabels(
  packageId: AdPackageId | string | null | undefined,
): string[] {
  const pkg = getAdPackage(packageId);
  const pageLabels = AD_PLACEMENT_CATALOG.filter(
    (row) => row.id !== "footer-sponsors" && pkg.pageSlotIds.includes(row.id),
  ).map((row) => `${row.label} (${row.dimensions})`);
  if (pkg.formats.includes("ribbon")) {
    const footer = AD_PLACEMENT_CATALOG.find((row) => row.id === "footer-sponsors");
    if (footer) pageLabels.push(`${footer.label} (${footer.dimensions})`);
  }
  return pageLabels;
}

export function isFooterSponsorSlotId(slotId: string): boolean {
  return slotId.startsWith(FOOTER_SPONSOR_SLOT_PREFIX);
}

/** Une campagne Premium/Ciblé/Essentiel peut-elle apparaître sur cet emplacement ? */
export function campaignCanUseSlot(
  campaign: Pick<AdCampaign, "adPackage" | "active">,
  slot: Pick<AdSlotDefinition, "id" | "format">,
): boolean {
  if (!campaign.active) return false;
  const pkg = getAdPackage(campaign.adPackage);
  if (!pkg.formats.includes(slot.format) && !(slot.format === "sidebar" && pkg.formats.includes("rectangle"))) {
    return false;
  }
  if (isFooterSponsorSlotId(slot.id)) {
    return pkg.formats.includes("ribbon");
  }
  return pkg.pageSlotIds.includes(slot.id);
}

export const DEFAULT_CAMPAIGN_PACKAGE: Record<string, AdPackageId> = {
  "moorea-maitai": "premium",
  "rai-tahiti": "premium",
};
