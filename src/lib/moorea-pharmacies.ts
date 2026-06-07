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
  {
    id: "pharmacie-tran-moorea",
    name: "Pharmacie Tran",
    district: "Paopao",
    address: "PK 6,5, Paopao",
    phone: "40 55 20 75",
    phoneHref: "tel:+68940552075",
  },
  {
    id: "pharmacie-moorea-haapiti",
    name: "Pharmacie Moorea Haapiti",
    district: "Tiahura",
    address: "Tiahura, Haapiti",
    phone: "40 56 41 16",
    phoneHref: "tel:+68940564116",
  },
];
