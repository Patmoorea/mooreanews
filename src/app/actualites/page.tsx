import { ActualitesListing } from "@/components/ActualitesListing";
import { listingPageMetadata } from "@/lib/seo";

export const revalidate = 1800;

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
