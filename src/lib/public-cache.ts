/** Repli ISR des pages publiques : 1 h, puis revalidation à la demande. */
export const PUBLIC_ISR_SECONDS = 3600;

/**
 * Cache CDN : 1 h frais, puis jusqu'à 24 h périmé pendant la régénération.
 * Les navigateurs ne gardent rien (`max-age` absent) : seul le CDN absorbe le trafic.
 */
export const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";
