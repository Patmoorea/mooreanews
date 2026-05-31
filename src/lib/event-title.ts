/**
 * Titres d'événements affichables (pas d'URL Facebook brute).
 */

const URL_TITLE = /^https?:\/\//i;

const FACEBOOK_NOISE = /facebook\.com\/(share|share\/p|groups|photo)/i;

export function humanEventTitle(
  title: string,
  fallback = "Événement sur l'agenda",
): string {
  const t = title.trim();
  if (!t) return fallback;
  if (URL_TITLE.test(t)) return fallback;
  if (FACEBOOK_NOISE.test(t)) return fallback;
  if (t.includes("facebook.com") && t.length < 120) return fallback;
  return t.slice(0, 80);
}

export function isUrlLikeTitle(title: string): boolean {
  const t = title.trim();
  return URL_TITLE.test(t) || FACEBOOK_NOISE.test(t);
}
