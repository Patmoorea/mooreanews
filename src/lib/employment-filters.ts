/**
 * Détection des offres emploi / formation expirées (CGF, Aravihi, SEFI…).
 * Les références CGF « 2024-2095 » ne sont pas des dates d’événement :
 * on les traite comme campagne de recrutement, pas comme faux positifs Facebook.
 */

/** Année campagne CGF / Aravihi dans l’identifiant (ex. 2024-2095). */
export function employmentCampaignYear(
  externalId: string,
  title?: string,
): number | null {
  const fromId = externalId.match(/^(\d{4})-\d+/);
  if (fromId) return Number(fromId[1]);
  const fromTitle = title?.match(/^(\d{4})-\d+/);
  if (fromTitle) return Number(fromTitle[1]);
  return null;
}

/** Date limite « Limite : JJ/MM/AAAA » dans l’extrait CGF. */
export function parseEmploymentLimitDate(
  excerpt: string | null,
): Date | null {
  if (!excerpt) return null;
  const m = excerpt.match(/Limite\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  date.setHours(23, 59, 59, 999);
  return date;
}

export function isExpiredEmploymentListing(row: {
  external_id: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  maxAgeDays?: number;
}): boolean {
  const campaignYear = employmentCampaignYear(row.external_id, row.title);
  const currentYear = new Date().getFullYear();
  if (campaignYear !== null && campaignYear < currentYear) return true;

  const limit = parseEmploymentLimitDate(row.excerpt);
  if (limit && limit.getTime() < Date.now()) return true;

  const maxAgeDays = row.maxAgeDays ?? 120;
  const pubMs = Date.parse(row.published_at);
  if (!Number.isNaN(pubMs) && campaignYear === null && !limit) {
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    if (Date.now() - pubMs > maxAgeMs) return true;
  }

  return false;
}
