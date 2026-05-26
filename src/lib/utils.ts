import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne intelligemment les classes Tailwind. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formate une date au format français long. */
export function formatDateFR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Formate une date au format court (ex: "12 mai"). */
export function formatDateShortFR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

/** Formate une heure (ex: "14h30"). */
export function formatTimeFR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Pacific/Tahiti",
    })
    .replace(":", "h");
}

/** Formate un nombre de minutes en "1h25" ou "25 min". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Convertit un texte en slug URL-friendly. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Heure actuelle à Tahiti (UTC-10), sous forme d'objet Date. */
export function nowInTahiti(): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return new Date(
    `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`
  );
}

/** Renvoie une chaîne "il y a Xh Y" en français. */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const h = Math.floor(min / 60);
  const days = Math.floor(h / 24);

  if (sec < 60) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  if (h < 24) return `il y a ${h} h`;
  if (days < 7) return `il y a ${days} j`;
  return formatDateShortFR(d);
}

/** Tronque un texte à une longueur donnée en préservant les mots. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
