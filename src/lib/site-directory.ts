/**
 * Plan du site — toutes les pages publiques, classées par rubrique.
 * Source unique pour l’accueil, le menu mobile et le footer.
 */

export type SiteLink = {
  href: string;
  label: string;
  description: string;
};

export type SiteDirectoryCategory = {
  id: string;
  title: string;
  description: string;
  links: SiteLink[];
};

export const SITE_DIRECTORY: SiteDirectoryCategory[] = [
  {
    id: "actualite",
    title: "Actualité & alertes",
    description: "L’info qui bouge sur l’île",
    links: [
      {
        href: "/actualites",
        label: "Actualités",
        description: "Dernières nouvelles locales",
      },
      {
        href: "/evenements",
        label: "Événements",
        description: "Agenda, concerts, marchés",
      },
      {
        href: "/annonces",
        label: "Annonces",
        description: "Vendre, louer, services",
      },
      {
        href: "/alertes",
        label: "Alertes",
        description: "Urgent, météo, circulation",
      },
      {
        href: "/signalements",
        label: "Signalements",
        description: "Coupe de route, panne, incivilité",
      },
    ],
  },
  {
    id: "sortir",
    title: "Sortir & manger",
    description: "Restaurants et loisirs",
    links: [
      {
        href: "/restaurants",
        label: "Restaurants",
        description: "Où manger, horaires",
      },
      {
        href: "/ce-soir",
        label: "Ce soir à Moorea",
        description: "Ouvert ce soir + agenda",
      },
      {
        href: "/activites",
        label: "Activités",
        description: "Plongée, quad, lagon",
      },
    ],
  },
  {
    id: "visiteurs",
    title: "Visiteurs & séjour",
    description: "Tourisme et hébergement",
    links: [
      {
        href: "/visiteurs",
        label: "Guide visiteurs",
        description: "Carte, plages, ferries",
      },
      {
        href: "/hebergements",
        label: "Hébergements",
        description: "Pensions, hôtels, fares",
      },
      {
        href: "/mon-sejour",
        label: "Mon séjour",
        description: "Plages, marées, météo perso",
      },
      {
        href: "/guides",
        label: "Guides pratiques",
        description: "Contenus permanents",
      },
      {
        href: "/guides/ferry-tahiti-moorea",
        label: "Ferry Tahiti ↔ Moorea",
        description: "Compagnies et conseils",
      },
      {
        href: "/guides/48h-moorea",
        label: "48h à Moorea",
        description: "Week-end sur l’île",
      },
      {
        href: "/visiteurs/pack-hebergeur",
        label: "Pack hébergeur",
        description: "QR chambre & ferry",
      },
      {
        href: "/vigilance-cyclone",
        label: "Vigilance cyclone",
        description: "Consignes et liens officiels",
      },
    ],
  },
  {
    id: "pratique",
    title: "Infos & services",
    description: "Utile au quotidien",
    links: [
      {
        href: "/infos-pratiques",
        label: "Infos pratiques",
        description: "Mairie, hôpital, urgences",
      },
      {
        href: "/assistant",
        label: "Assistant Moorea",
        description: "Réponses FAQ locales",
      },
      {
        href: "/qui-sait-quoi",
        label: "Qui sait quoi",
        description: "Compétences et contacts",
      },
      {
        href: "/associations",
        label: "Associations",
        description: "Collectifs de l’île",
      },
      {
        href: "/#en-direct",
        label: "Météo & ferries (live)",
        description: "Widgets temps réel accueil",
      },
    ],
  },
  {
    id: "participer",
    title: "Participer",
    description: "Contribuer au site",
    links: [
      {
        href: "/soumettre",
        label: "Publier une info",
        description: "Gratuit, validation 24 h",
      },
      {
        href: "/commercant",
        label: "Espace commerçant",
        description: "Ouvert/fermé, dispo chambres",
      },
      {
        href: "/partenaires",
        label: "Partenaires & annonceurs",
        description: "Visibilité locale",
      },
      {
        href: "/contact",
        label: "Nous contacter",
        description: "Message à l’équipe",
      },
    ],
  },
  {
    id: "site",
    title: "MooreaNews",
    description: "Application & compte",
    links: [
      {
        href: "/app",
        label: "App MooreaNews",
        description: "Fonctions PWA",
      },
      {
        href: "/telecharger",
        label: "Télécharger l’app",
        description: "Android APK",
      },
      {
        href: "/recherche",
        label: "Recherche",
        description: "Tout le contenu",
      },
      {
        href: "/a-propos",
        label: "À propos",
        description: "Qui sommes-nous",
      },
      {
        href: "/en",
        label: "English",
        description: "Visitor essentials",
      },
      {
        href: "/mon-compte",
        label: "Mon compte",
        description: "Alertes et favoris",
      },
      {
        href: "/auth/login",
        label: "Connexion",
        description: "Compte utilisateur",
      },
      {
        href: "/mentions-legales",
        label: "Mentions légales",
        description: "Éditeur du site",
      },
      {
        href: "/confidentialite",
        label: "Confidentialité",
        description: "Données personnelles",
      },
    ],
  },
];

export function allSiteDirectoryLinks(): SiteLink[] {
  return SITE_DIRECTORY.flatMap((c) => c.links);
}
