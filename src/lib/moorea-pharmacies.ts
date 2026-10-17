/**
 * Pharmacies Moorea — référence pour reconnaître les annonces de garde.
 */

export type MooreaPharmacy = {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  phoneHref: string;
};

export const MOOREA_PHARMACIES: MooreaPharmacy[] = [
  {
    id: "pharmacie-moorea-afareaitu",
    name: "Pharmacie Moorea-Afareaitu",
    district: "Afareaitu",
    address: "PK 8,7 côté montagne, Afareaitu",
    phone: "40 56 35 47",
    phoneHref: "tel:+68940563547",
  },
  // Pharmacie Tran (Paopao) et Haapiti (Tiahura) retirées : numéros non vérifiés.
];
