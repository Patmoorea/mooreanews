import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { HebergementsDirectory } from "@/components/hebergements/HebergementsDirectory";
import { getVisitorAccommodations } from "@/lib/accommodations";

/** Une seule page. Le filtre `?type=` est appliqué dans le navigateur. */
export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hébergements à Moorea",
  description:
    "31 pensions de famille, hôtels, fares et locations à Moorea — annuaire visiteurs MooreaNews.",
  alternates: { canonical: "/hebergements" },
};

export default async function HebergementsPage() {
  const allItems = await getVisitorAccommodations();
  const pensionCount = allItems.filter((a) => a.type === "pension").length;

  return (
    <>
      <PageHeader
        badge="Dormir"
        title="Où dormir à Moorea"
        description={`${pensionCount} pensions de famille, hôtels et fares — disponibilités signalées ou sur demande.`}
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <p className="mb-6 text-sm text-ocean-600">
          <Link href="/visiteurs" className="font-semibold text-lagon-700 hover:underline">
            ← Guide visiteurs
          </Link>
          {" · "}
          <Link href="/annonces" className="font-semibold text-lagon-700 hover:underline">
            Annonces location
          </Link>
        </p>
        <HebergementsDirectory items={allItems} />
      </Container>
    </>
  );
}
