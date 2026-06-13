/** Heure locale Polynésie (UTC−10, pas de changement d'heure). */

const DAY_INDEX: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export type TahitiClock = {
  hour: number;
  minute: number;
  weekday: number;
  label: string;
};

export function getTahitiClock(now = new Date()): TahitiClock {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(now)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  const weekdayName = parts.weekday ?? "Monday";
  return {
    hour: parseInt(parts.hour ?? "0", 10),
    minute: parseInt(parts.minute ?? "0", 10),
    weekday: DAY_INDEX[weekdayName] ?? 0,
    label: `${weekdayName} ${parts.hour}:${parts.minute} (Tahiti)`,
  };
}

/** Digest matin : 7h Tahiti (1×/jour — veille GitHub ~17h UTC). */
export function shouldSendMorningDigest(clock: TahitiClock): boolean {
  return clock.hour === 7;
}

/** Digest week-end : vendredi 7h Tahiti uniquement. */
export function shouldSendWeekendDigest(clock: TahitiClock): boolean {
  return clock.weekday === 5 && clock.hour === 7;
}

/** Garde week-end Moorea : vendredi matin Tahiti (OCR + affiche MooreaNews). */
export function shouldPublishGardeWeekend(clock: TahitiClock): boolean {
  return clock.weekday === 5 && clock.hour >= 5 && clock.hour <= 8;
}

/** Veille horaire : sync garde ven–dim (+ jeu ≥17h si commune publie tôt). */
export function shouldSyncGardeOnVeille(clock: TahitiClock): boolean {
  if (clock.weekday === 4 && clock.hour >= 17) return true;
  return clock.weekday === 5 || clock.weekday === 6 || clock.weekday === 0;
}

/** Récap semaine Moorea : lundi matin Tahiti (agenda + actu). */
export function shouldPublishWeeklyRecap(clock: TahitiClock): boolean {
  return clock.weekday === 1 && clock.hour >= 5 && clock.hour <= 9;
}

/** Newsletter semaine suivante : dimanche 18h Tahiti. */
export function shouldSendWeeklyNewsletter(clock: TahitiClock): boolean {
  return clock.weekday === 0 && clock.hour === 18;
}

/** Push « Ce soir à Moorea » : jeu–dim entre 16h et 20h Tahiti (cron externe recommandé). */
export function shouldSendEveningDigest(clock: TahitiClock): boolean {
  const eveningDays = new Set([0, 4, 5, 6]);
  return eveningDays.has(clock.weekday) && clock.hour >= 16 && clock.hour < 20;
}
