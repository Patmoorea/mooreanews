import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { AccommodationsList } from "@/components/visiteurs/AccommodationsList";
import { getVisitorAccommodations } from "@/lib/accommodations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hébergements à Moorea",
  description:
    "Hôtels, pensions, fares et locations à Moorea — annuaire visiteurs MooreaNews.",
  alternates: { canonical: "/hebergements" },
};

export default async function HebergementsPage() {
  const items = await getVisitorAccommodations();

  return (
    <>
      <PageHeader
        badge="Dormir"
        title="Où dormir à Moorea"
        description="Hôtels, pensions et fares — disponibilités signalées ou sur demande."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <p className="mb-8 text-sm text-ocean-600">
          <Link href="/visiteurs" className="font-semibold text-lagon-700 hover:underline">
            ← Guide visiteurs
          </Link>
          {" · "}
          <Link href="/annonces" className="font-semibold text-lagon-700 hover:underline">
            Annonces location
          </Link>
        </p>
        <AccommodationsList items={items} />
      </Container>
    </>
  );
}
