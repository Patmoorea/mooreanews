/**
 * Détection stricte : avis officiel ferry / carénage — pas une vente « au débarcadère ».
 */

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Vente, food truck, événement perso près du quai — pas une alerte ferry. */
const NOT_FERRY_ALERT = [
  "choux",
  "a la creme",
  "à la crème",
  "creme",
  "crème",
  "gaufre",
  "patisserie",
  "pâtisserie",
  "gateau",
  "gâteau",
  "on se retrouve",
  "avec moi",
  "avec mon homme",
  "fete des",
  "fête des",
  "nouveaute",
  "nouveauté",
  "stand",
  "food truck",
  "vends ",
  "a vendre",
  "à vendre",
  "vente ",
  "9h a 17h",
  "9h à 17h",
  "cocktail",
  "restaurant",
  "snack",
];

/** Signal fort = alerte ferry légitime. */
const STRONG_FERRY = [
  "carenage",
  "carénage",
  "annulation ferry",
  "ferry annul",
  "traversee annul",
  "traversée annul",
  "ferry indisponible",
  "traversee indisponible",
  "traversée indisponible",
  "perturbation ferry",
  "perturbation des traversees",
  "perturbation des traversées",
  "interruption de la traversee",
  "interruption de la traversée",
  "sans traversee",
  "sans traversée",
  "retard ferry",
  "ferry retard",
  "navire indisponible",
  "service ferry suspendu",
];

const FERRY_COMPANIES =
  /tauati|aremiti|vaearai|avatea|terevau|aremiti/i;

const DISRUPTION =
  /annul|retard|perturb|indisponib|interromp|carenage|carénage|suspend|reporte|reporté/i;

/** Texte OG Facebook (page, promo) — jamais une alerte ferry. */
export function isFacebookAlertJunk(text: string): boolean {
  const n = normalize(text);
  if (!n.trim()) return false;
  return (
    /\d+\s*likes/.test(n) ||
    n.includes("talking about this") ||
    n.includes("people follow this") ||
    n.includes("suivez l actualite") ||
    n.includes("suivez l'actualite") ||
    n.includes("pass annuel") ||
    n.includes("en illimite") ||
    n.includes("en illimité") ||
    n.includes("tarif preferentiel") ||
    n.includes("billetterie") ||
    (n.includes("infos cyclones") && !n.includes("vigilance")) ||
    (n.includes("cyclonique") && n.includes("likes"))
  );
}

export function isFerryTransportNotice(message: string): boolean {
  const n = normalize(message);
  if (!n.trim()) return false;

  if (isFacebookAlertJunk(message)) return false;

  if (NOT_FERRY_ALERT.some((k) => n.includes(normalize(k)))) {
    return false;
  }

  if (STRONG_FERRY.some((k) => n.includes(normalize(k)))) {
    return true;
  }

  const mentionsCompany = FERRY_COMPANIES.test(message);
  const mentionsDisruption = DISRUPTION.test(message);
  const mentionsFerry = /\bferry\b|traversee|traversée/.test(n);

  return (
    (mentionsFerry && mentionsDisruption) ||
    (mentionsCompany && mentionsDisruption)
  );
}
