/** Plage lundi→dimanche de la semaine à venir (heure Tahiti). */

export type WeekRange = {
  start: string;
  end: string;
  label: string;
};

function tahitiCalendarDate(now = new Date()): Date {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Pacific/Tahiti",
  });
}

/** Semaine suivante : du lundi au dimanche (envoi typique le dimanche 18h). */
export function getNextWeekRange(now = new Date()): WeekRange {
  const today = tahitiCalendarDate(now);
  const weekday = today.getDay();
  const monday = new Date(today);
  if (weekday === 0) {
    monday.setDate(today.getDate() + 1);
  } else {
    const daysUntilNextMonday = ((8 - weekday) % 7) || 7;
    monday.setDate(today.getDate() + daysUntilNextMonday);
  }
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const start = toIso(monday);
  const end = toIso(sunday);
  return {
    start,
    end,
    label: `du ${formatDay(start)} au ${formatDay(end)}`,
  };
}
