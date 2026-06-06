/** Erreurs réseau / hébergeur — source RSS souvent indisponible, non bloquant. */
export function isTransientFeedError(message: string): boolean {
  return (
    /HTTP (429|502|503|504|520|522|524)/i.test(message) ||
    /timeout|timed out|ECONNRESET|fetch failed|connection reset/i.test(
      message,
    )
  );
}

/** Ne pas alarmer Telegram pour ces avertissements veille. */
export function isOptionalVeilleWarning(error: string): boolean {
  if (isTransientFeedError(error)) return true;
  const lower = error.toLowerCase();
  return (
    lower.includes("presidence.pf") ||
    lower.includes("polynesie-1ere") ||
    lower.includes("la1ere.francetvinfo.fr") ||
    /facebook-page-[^/]+\/fb-graph-[^:]+: empty or invalid json/i.test(
      error,
    )
  );
}
