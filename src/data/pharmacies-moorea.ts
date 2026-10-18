/**
 * Pharmacies de Moorea — fichier à éditer pour corriger adresse, téléphone et horaires.
 * Utilisé par /infos-pratiques, /sante-garde et l'image de garde MooreaNews.
 *
 * Les horaires du samedi de la Pharmacie Tran restent marqués « horaires à confirmer ».
 */

export type MooreaPharmacySource = {
  label: string;
  href: string;
};

export type MooreaPharmacyRecord = {
  id: string;
  name: string;
  /** Nom court dans la ligne « Horaires pharmacies du week-end ». */
  district: string;
  address: string;
  phone: string;
  phoneHref: string;
  /** Mots qui désignent l'officine dans une annonce. Ne pas y mettre « moorea ». */
  aliases: readonly string[];
  infoSlug: string;
  /** Anciens titres de fiche, pour remplacer la ligne plutôt que la dupliquer. */
  infoTitles: readonly string[];
  description: string;
  /** Horaires habituels, une seule ligne. */
  hoursLabel: string;
  saturday: string;
  /** Vrai seulement quand le samedi publié n'est pas encore confirmé. */
  saturdayUnconfirmed?: boolean;
  sunday: string;
  sources: readonly MooreaPharmacySource[];
};

export const PHARMACY_DUTY_UNLISTED = "Non renseignée, appelez la DSP (40 47 01 44)";

const ORDRE_PHARMACIES_URL =
  "https://www.ordre-pharmaciens-polynesie.com/pharmacies_en_polynesie-francaise/";

export const MOOREA_PHARMACIES: MooreaPharmacyRecord[] = [
  {
    id: "pharmacie-moorea-afareaitu",
    name: "Pharmacie Moorea-Afareaitu",
    district: "Afareaitu",
    address: "PK 8,7 côté montagne, Afareaitu",
    phone: "40 56 35 47",
    phoneHref: "tel:+68940563547",
    aliases: ["afareaitu"],
    infoSlug: "pharmacie-afareaitu",
    infoTitles: ["Pharmacie Moorea-Afareaitu"],
    description:
      "Pharmacie principale côté montagne. Ouverte le dimanche et jours fériés le matin (7h30–11h30).",
    hoursLabel: "Lun–ven 6h30–18h30 · sam 7h30–13h30 · dim et fériés 7h30–11h30",
    saturday: "7h30–13h30",
    sunday: "7h30–11h30 (dim et fériés)",
    sources: [
      { label: "Ordre des pharmaciens", href: ORDRE_PHARMACIES_URL },
      {
        label: "Tahiti Tourisme",
        href: "https://www.tahititourisme.com/service/pharmacie-moorea-afareaitu/",
      },
    ],
  },
  {
    id: "pharmacie-tran-moorea",
    name: "Pharmacie Tran",
    district: "Paopao",
    address: "Paopao, PK 6,5",
    phone: "40 55 20 75",
    phoneHref: "tel:+68940552075",
    aliases: ["tran"],
    infoSlug: "pharmacie-tran-paopao",
    infoTitles: ["Pharmacie Tran", "Pharmacie Tran — Paopao", "Pharmacie Tran - Paopao"],
    description:
      "Pharmacie de Paopao, PK 6,5. Le samedi, les horaires sont à confirmer.",
    hoursLabel:
      "Lun–ven 7h00–12h15 et 14h00–17h30 · sam 7h30–12h15 et 14h00–16h30 (horaires à confirmer) · dim 8h00–11h00",
    saturday: "7h30–12h15 et 14h00–16h30",
    saturdayUnconfirmed: true,
    sunday: "8h00–11h00",
    sources: [
      {
        label: "Tahiti Tourisme",
        href: "https://tahititourisme.pf/experiences/le-plein-activites/pharmacie-moorea-tran-paopao-moorea-fr-3455684/",
      },
    ],
  },
  {
    id: "pharmacie-moorea-haapiti",
    name: "Pharmacie Haapiti",
    district: "Tiahura",
    address: "PK 26,9, Tiahura",
    phone: "40 56 41 16",
    phoneHref: "tel:+68940564116",
    aliases: ["haapiti", "tiahura"],
    infoSlug: "pharmacie-haapiti",
    infoTitles: ["Pharmacie Haapiti", "Pharmacie Moorea Haapiti"],
    description:
      "Pharmacie de Tiahura, PK 26,9. Ouverte le dimanche et jours fériés le matin (8h00–10h00).",
    hoursLabel: "Lun–ven 8h00–16h30 · sam 9h00–12h30 · dim et fériés 8h00–10h00",
    saturday: "9h00–12h30",
    sunday: "8h00–10h00 (dim et fériés)",
    sources: [{ label: "Ordre des pharmaciens", href: ORDRE_PHARMACIES_URL }],
  },
];

export function weekendHoursClause(pharmacy: MooreaPharmacyRecord): string {
  const saturday = pharmacy.saturdayUnconfirmed
    ? `${pharmacy.saturday} (horaires à confirmer)`
    : pharmacy.saturday;
  return `${pharmacy.district} (${pharmacy.phone}) : sam. ${saturday} · dim. ${pharmacy.sunday}`;
}

/** Ligne d'article. Vide si aucun horaire chiffré : on n'affiche pas « : — ». */
export function weekendPharmacyHoursParagraph(): string {
  const lines = MOOREA_PHARMACIES.map(weekendHoursClause).filter((line) =>
    /\d{1,2}\s*h/i.test(line),
  );
  if (!lines.length) return "";
  return `Horaires pharmacies du week-end : ${lines.join(" — ")}.`;
}
