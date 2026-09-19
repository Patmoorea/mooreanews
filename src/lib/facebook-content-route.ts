/**
 * Où publier un contenu Facebook importé (alerte, actualité, événement…).
 */

import {
  classifyFacebookPost,
  type FacebookPostKind,
} from "@/lib/facebook-post-parse";
import {
  isFacebookPageBoilerplate,
  isFerryPromoArticle,
  isFerryTransportNotice,
} from "@/lib/ferry-notice-detect";

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Bulletin cyclone / vigilance — alerte météo, pas ferry. */
export function isCycloneMeteoNotice(
  message: string,
  sourceLabel?: string,
): boolean {
  const n = normalize(message);
  if (isFacebookPageBoilerplate(message)) return false;

  // « Infos Cyclones » seul = nom de page, pas un bulletin.
  const realSignal =
    n.includes("vigilance") ||
    n.includes("tempete tropicale") ||
    n.includes("tempête tropicale") ||
    n.includes("alerte meteo") ||
    n.includes("alerte météo") ||
    n.includes("alerte orange") ||
    n.includes("alerte rouge") ||
    n.includes("alerte jaune") ||
    n.includes("phenomene") ||
    n.includes("phénomène") ||
    n.includes("bulletin") ||
    /\bcyclonique\b/.test(n) ||
    (n.includes("cyclone") &&
      (n.includes("alerte") ||
        n.includes("vigilance") ||
        n.includes("depression") ||
        n.includes("dépression") ||
        n.includes("formation") ||
        n.includes("trajet") ||
        n.includes("prevision") ||
        n.includes("prévision")));

  if (!realSignal) return false;

  const label = normalize(sourceLabel ?? "");
  const fromCycloneSource =
    label.includes("cyclone") ||
    label.includes("meteo") ||
    label.includes("météo") ||
    label.includes("vigilance");

  if (fromCycloneSource) return true;
  return (
    n.includes("polynesie") ||
    n.includes("polynésie") ||
    n.includes("moorea") ||
    n.includes("tahiti")
  );
}

export type FacebookImportTarget =
  | "skip"
  | "ferry_alert"
  | "meteo_alert"
  | FacebookPostKind;

export function routeFacebookImport(
  message: string,
  options?: {
    sourceLabel?: string;
    hasImage?: boolean;
    importAllFeedPosts?: boolean;
  },
): FacebookImportTarget {
  const text = message.trim();
  if (!text || isFacebookPageBoilerplate(text)) {
    if (options?.importAllFeedPosts || options?.hasImage) {
      return "article";
    }
    return "skip";
  }

  if (isCycloneMeteoNotice(text, options?.sourceLabel)) {
    return "meteo_alert";
  }

  if (isFerryPromoArticle(text)) {
    return "article";
  }

  if (isFerryTransportNotice(text)) {
    return "ferry_alert";
  }

  return classifyFacebookPost(text, Boolean(options?.hasImage));
}
