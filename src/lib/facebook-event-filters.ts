/**
 * Événements créés depuis Facebook avec date mal recalée (« ce vendredi » → vendredi 2026).
 */

import {
  contentReferencesStaleYear,
  facebookImportMaxAgeDays,
} from "@/lib/facebook-import-filters";
import {
  hasRelativeWeekdayDate,
  parseDateFromMessage,
} from "@/lib/facebook-post-parse";

export type FacebookEventRow = {
  title: string;
  description: string;
  date: string;
  url: string | null;
  created_at: string;
};

function isFacebookEventUrl(url: string | null | undefined): boolean {
  return /facebook\.com/i.test(url?.trim() ?? "");
}

/** Événement Facebook dont la date affichée ne correspond pas au post d’origine. */
export function isStaleFacebookEvent(row: FacebookEventRow): boolean {
  if (!isFacebookEventUrl(row.url)) return false;

  const corpus = `${row.title} ${row.description}`;
  if (contentReferencesStaleYear(corpus)) return true;

  const today = new Date().toISOString().slice(0, 10);
  const stored = row.date.slice(0, 10);
  const refDay = row.created_at.slice(0, 10);

  if (!hasRelativeWeekdayDate(corpus)) {
    return stored >= today && Date.now() - Date.parse(row.created_at) > maxAgeMs();
  }

  const anchored = parseDateFromMessage(corpus, refDay);
  if (!anchored) return false;

  // Date recalée sur « ce vendredi » à partir d’aujourd’hui au lieu de la date du post.
  if (stored >= today && anchored < today && anchored !== stored) return true;

  // Post importé il y a longtemps mais événement encore dans le futur.
  if (stored >= today && Date.now() - Date.parse(row.created_at) > maxAgeMs()) {
    return true;
  }

  return false;
}

function maxAgeMs(): number {
  return facebookImportMaxAgeDays() * 24 * 60 * 60 * 1000;
}
