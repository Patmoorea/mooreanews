/**
 * Types partagés pour le contenu (articles, événements, annonces, restaurants, etc.).
 * Ces types valent pour les données JSON statiques *et* (plus tard) Supabase.
 */

import type { CategorySlug } from "@/lib/constants";

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: CategorySlug;
  publishedAt: string;
  author?: string;
  image?: string;
  featured?: boolean;
  tags?: string[];
};

export type Event = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date
  endDate?: string;
  time?: string;
  location: string;
  district?: string;
  category: "musique" | "marche" | "sport" | "fete" | "culture" | "autre";
  image?: string;
  organizer?: string;
  price?: string;
  contact?: string;
  url?: string;
};

export type Announcement = {
  slug: string;
  title: string;
  body: string;
  type: "vente" | "achat" | "location" | "emploi" | "service" | "perdu-trouve";
  price?: string;
  contact: string;
  district?: string;
  publishedAt: string;
  image?: string;
};

export type Restaurant = {
  slug: string;
  name: string;
  description: string;
  cuisine: string[];
  priceLevel: 1 | 2 | 3 | 4; // 1=économique … 4=gastronomique (échelle indicative)
  district: string;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  image?: string;
  lat?: number;
  lon?: number;
  features?: string[];
  premium?: boolean;
};

export type Activity = {
  slug: string;
  name: string;
  description: string;
  category:
    | "plongee"
    | "randonnee"
    | "lagon"
    | "culture"
    | "nature"
    | "sport"
    | "famille";
  district?: string;
  duration?: string;
  price?: string;
  contact?: string;
  website?: string;
  image?: string;
  lat?: number;
  lon?: number;
};

export type InfoPratique = {
  slug: string;
  title: string;
  description: string;
  category:
    | "sante"
    | "transport"
    | "administration"
    | "commerce"
    | "urgence"
    | "education";
  address?: string;
  phone?: string;
  hours?: string;
  website?: string;
  image?: string;
  lat?: number;
  lon?: number;
  /** Logo sur la carte interactive (URL ou chemin /partners/…) */
  mapIconUrl?: string;
};
