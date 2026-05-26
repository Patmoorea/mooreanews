/**
 * Estimation simplifiée des marées pour Moorea / Tahiti.
 *
 * Polynésie française a un régime de marée semi-diurne très faible
 * (amplitude ~30 cm). Les horaires des marées hautes sont quasi
 * synchronisés sur le passage du soleil au méridien (midi solaire +/- 30 min)
 * et non sur la lune comme dans la plupart des autres régions du monde.
 *
 * Cette particularité est documentée par le SHOM et permet une approximation
 * raisonnable sans clé API. Pour des données précises (navigation, plongée),
 * consulter shom.fr ou marees.fr.
 */

export type Tide = {
  type: "high" | "low";
  date: Date;
  /** Texte ISO en heure de Tahiti */
  isoTahiti: string;
};

const TIDE_PERIOD_HOURS = 12.42; // période M2 semi-diurne
const HIGH_TIDE_OFFSET_HOURS = 0; // marée haute ≈ midi solaire à Papeete

/** Crée une Date pour aujourd'hui en heure Tahiti à hh:mm */
function tahitiDateAt(hours: number, dayOffset: number = 0): Date {
  const now = new Date();
  // Construire la date en UTC : Tahiti = UTC-10
  const utcMillis =
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + dayOffset,
      Math.floor(hours) + 10, // +10 pour passer de heure Tahiti à UTC
      Math.round((hours - Math.floor(hours)) * 60),
      0,
    );
  return new Date(utcMillis);
}

/** Renvoie 4 prochaines marées (haute/basse alternées) */
export function getNextTides(now: Date = new Date(), count: number = 4): Tide[] {
  const tides: Tide[] = [];

  // Marée haute du jour ≈ 12h00 locale (référence Papeete/Moorea)
  // Marée basse ≈ 12h00 + 6.21h ≈ 18h15
  // Et idem 12h plus tard.
  const baseHighHour = 12 + HIGH_TIDE_OFFSET_HOURS;

  for (let day = 0; day < 3 && tides.length < count + 2; day++) {
    for (let i = 0; i < 4; i++) {
      const hourOfDay = baseHighHour - 12 + i * (TIDE_PERIOD_HOURS / 2);
      const type: "high" | "low" = i % 2 === 0 ? "high" : "low";
      const date = tahitiDateAt(hourOfDay, day);
      tides.push({
        type,
        date,
        isoTahiti: date.toISOString(),
      });
    }
  }

  // Garder uniquement les marées futures
  const future = tides.filter((t) => t.date.getTime() > now.getTime());
  future.sort((a, b) => a.date.getTime() - b.date.getTime());
  return future.slice(0, count);
}
