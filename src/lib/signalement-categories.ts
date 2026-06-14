/** Catégories signalement citoyen — web + Telegram. */

export type SignalementCategoryId =
  | "route"
  | "ferry"
  | "accident"
  | "incendie"
  | "baleines"
  | "meteo"
  | "meduse"
  | "resto"
  | "autre";

export type SignalementCategory = {
  id: SignalementCategoryId;
  label: string;
  emoji: string;
  title: string;
  requiresPhoto: boolean;
  urgent: boolean;
  alertType: "route" | "ferry" | "meteo" | "autre";
};

export const SIGNALEMENT_CATEGORIES: SignalementCategory[] = [
  {
    id: "route",
    label: "Route / coupure",
    emoji: "🚧",
    title: "Signalement — coupure ou travaux route",
    requiresPhoto: false,
    urgent: true,
    alertType: "route",
  },
  {
    id: "ferry",
    label: "Ferry annulé / retard",
    emoji: "⛴️",
    title: "Signalement — ferry annulé ou retard important",
    requiresPhoto: false,
    urgent: true,
    alertType: "ferry",
  },
  {
    id: "accident",
    label: "Accident",
    emoji: "🚨",
    title: "Signalement — accident",
    requiresPhoto: true,
    urgent: true,
    alertType: "autre",
  },
  {
    id: "incendie",
    label: "Incendie",
    emoji: "🔥",
    title: "Signalement — incendie",
    requiresPhoto: true,
    urgent: true,
    alertType: "autre",
  },
  {
    id: "baleines",
    label: "Baleines",
    emoji: "🐋",
    title: "Signalement — baleines / cétacés",
    requiresPhoto: true,
    urgent: false,
    alertType: "autre",
  },
  {
    id: "meteo",
    label: "Météo locale",
    emoji: "🌧️",
    title: "Signalement — météo locale (pluie, vent, inondation…)",
    requiresPhoto: true,
    urgent: false,
    alertType: "meteo",
  },
  {
    id: "meduse",
    label: "Méduse / baignade",
    emoji: "🪼",
    title: "Signalement — méduse ou baignade dangereuse",
    requiresPhoto: false,
    urgent: true,
    alertType: "autre",
  },
  {
    id: "resto",
    label: "Restaurant complet / fermé",
    emoji: "🍽️",
    title: "Signalement — restaurant complet ou fermé exceptionnellement",
    requiresPhoto: false,
    urgent: false,
    alertType: "autre",
  },
  {
    id: "autre",
    label: "Autre alerte locale",
    emoji: "📢",
    title: "Signalement — information locale urgente",
    requiresPhoto: false,
    urgent: false,
    alertType: "autre",
  },
];

export function getSignalementCategory(
  id: string | null | undefined,
): SignalementCategory {
  return (
    SIGNALEMENT_CATEGORIES.find((c) => c.id === id) ??
    SIGNALEMENT_CATEGORIES.find((c) => c.id === "autre")!
  );
}

export function signalementCategoryRequiresPhoto(id: string): boolean {
  return getSignalementCategory(id).requiresPhoto;
}

export function alertTypeFromSignalement(
  categoryId: string,
  text: string,
): SignalementCategory["alertType"] {
  const cat = getSignalementCategory(categoryId);
  if (cat.alertType !== "autre") return cat.alertType;
  const n = text.toLowerCase();
  if (/ferry|traversée|aremiti|vaeara/i.test(n)) return "ferry";
  if (/route|coupure|travaux|pk/i.test(n)) return "route";
  if (/météo|meteo|pluie|vent|cyclone|inondation/i.test(n)) return "meteo";
  return "autre";
}

export function isSignalementBreaking(
  categoryId: string,
  text: string,
): boolean {
  const cat = getSignalementCategory(categoryId);
  if (cat.urgent) return true;
  return /ferry|route|coupure|cyclone|méduse|meduse|urgent|annul|incendie|accident/i.test(
    text,
  );
}
