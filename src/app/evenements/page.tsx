import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { AdSlot } from "@/components/ads/AdSlot";
import { EvenementsDirectory } from "@/components/evenements/EvenementsDirectory";
import { getUpcomingEvents } from "@/lib/content";
import { listingPageMetadata } from "@/lib/seo";

/**
 * Une seule variante ISR. Le filtre de dates est côté client
 * pour qu'un `?du=` de bot ne lance pas un rendu.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata = listingPageMetadata({
  title: "Agenda des événements à Moorea",
  description:
    "Tous les événements à venir sur Moorea : concerts, marchés, fêtes traditionnelles, sport, culture.",
  path: "/evenements",
});

export default async function EvenementsPage(): Promise<ReactNode> {
  const events = await getUpcomingEvents();

  return (
    <>
      <PageHeader
        badge="Agenda"
        title="Événements à Moorea"
        description="Concerts, marchés, fêtes traditionnelles, sport et culture. Tout l'agenda de l'île, mis à jour en permanence."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        <AdSlot slotId="evenements-top" className="mb-6" />
        <EvenementsDirectory events={events} />
      </Container>
    </>
  );
}
