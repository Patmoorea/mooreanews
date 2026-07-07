import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { CovoiturageForm } from "@/components/CovoiturageForm";
import { CovoiturageList } from "@/components/CovoiturageList";
import { CovoiturageFerryPanel } from "@/components/CovoiturageFerryPanel";
import { getCarpoolOffers } from "@/lib/content";
import { expireStaleAnnouncements } from "@/lib/announcement-expiry";
import { listingPageMetadata } from "@/lib/seo";
import { MOOREA_COMMUNITY_LINKS, SOCIAL } from "@/lib/constants";
import Link from "next/link";
import { Share2 } from "lucide-react";

export const revalidate = 120;

export const metadata = listingPageMetadata({
  title: "Covoiturage ferry Moorea — Tahiti",
  description:
    "Proposez ou trouvez un covoiturage vers le quai Vaiare ou depuis Papeete. Moins de voitures au parking, partage des frais.",
  path: "/covoiturage",
});

export default async function CovoituragePage() {
  await expireStaleAnnouncements();
  const offers = await getCarpoolOffers();

  const fbGroup =
    MOOREA_COMMUNITY_LINKS.find((l) => l.href.includes("/groups/"))?.href ??
    SOCIAL.facebook;

  return (
    <>
      <PageHeader
        badge="Ferry · Quai Vaiare"
        title="Covoiturage Moorea ↔ Tahiti"
        description="Des milliers de navetteurs chaque jour : partagez la route, libérez le parking du quai (~300 XPF/jour) et les frais de carburant."
        variant="lagon"
      />
      <Container className="py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <CovoiturageFerryPanel />
            <CovoiturageForm />
            <div className="rounded-2xl border border-ocean-100 bg-ocean-50/50 p-4 text-sm text-ocean-700">
              <p className="font-semibold text-ocean-900 flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Partager aussi sur Facebook
              </p>
              <p className="mt-2">
                Après publication, partagez le lien dans le{" "}
                <a
                  href={fbGroup}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-lagon-700 underline"
                >
                  groupe Facebook Moorea
                </a>{" "}
                pour toucher plus de monde.
              </p>
            </div>
          </div>
          <div className="lg:col-span-3">
            <h2 className="font-display text-xl font-bold text-ocean-900 mb-4">
              Trajets disponibles ({offers.length})
            </h2>
            <CovoiturageList offers={offers} />
          </div>
        </div>
      </Container>
    </>
  );
}
