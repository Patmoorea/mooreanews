import { ActualitesListing } from "@/components/ActualitesListing";
import { listingPageMetadata } from "@/lib/seo";

/** Liste d'actus : 1 h suffit, et évite de réécrire ~170 Ko toutes les 30 min. */
export const revalidate = 3600;

export const metadata = listingPageMetadata({
  title: "Actualités de Moorea",
  description:
    "Toute l'actualité de Moorea : événements communaux, environnement, transport, santé, vie locale.",
  path: "/actualites",
  rssPath: "/actualites/feed.xml",
});

export default async function ActualitesPage() {
  return <ActualitesListing page={1} />;
}
