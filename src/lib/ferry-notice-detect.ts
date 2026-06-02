/**
 * Détection ferry / coquilles Facebook / promos transport.
 */

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Coquille « 58 629 likes · talking about » — pas de publication à importer. */
export function isFacebookPageBoilerplate(text: string): boolean {
  const n = normalize(text);
  if (!n.trim()) return true;
  const hasLikes = /\d[\d\s,.]*\s*likes/.test(n);
  const hasTalking = n.includes("talking about");
  const hasFollow =
    n.includes("people follow this") ||
    n.includes("suivez l actualite") ||
    n.includes("suivez l'actualite");
  if (hasLikes && (hasTalking || hasFollow)) return true;
  if (
    n.includes("infos cyclones") &&
    hasLikes &&
    !n.includes("vigilance") &&
    n.length < 220
  ) {
    return true;
  }
  return false;
}

/** Promo / info commerciale transport — actualité, pas alerte ferry. */
export function isFerryPromoArticle(message: string): boolean {
  const n = normalize(message);
  return (
    n.includes("pass annuel") ||
    n.includes("en illimite") ||
    n.includes("en illimité") ||
    n.includes("iles par la mer") ||
    n.includes("îles par la mer") ||
    (n.includes("forfait") && n.includes("ferry")) ||
    (n.includes("tarif") &&
      n.includes("traversee") &&
      !/annul|indisponib|carenage|carénage/.test(n))
  );
}

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

/** @deprecated Utiliser isFacebookPageBoilerplate */
export function isFacebookAlertJunk(text: string): boolean {
  return isFacebookPageBoilerplate(text);
}

export function isFerryTransportNotice(message: string): boolean {
  const n = normalize(message);
  if (!n.trim()) return false;
  if (isFacebookPageBoilerplate(message)) return false;
  if (isFerryPromoArticle(message)) return false;

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
