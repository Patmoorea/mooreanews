/** Octobre rose 2026 — thème visuel, heure de Tahiti (UTC−10, sans heure d'été). */

const TIME_ZONE = "Pacific/Tahiti";

export function isOctobreRoseActive(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year === "2026" && month === "10";
}
