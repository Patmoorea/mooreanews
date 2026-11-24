import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { MonSejourSwitch } from "@/components/trip/MonSejourSwitch";
import { buildTripPlan } from "@/lib/mon-sejour";

/** Les deux durées sont précalculées. `?duree=` ne crée pas de variante de cache. */
export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Mon séjour à Moorea",
  description:
    "Itinéraire personnalisé 48h ou 7 jours : plages, ferry, restaurants, événements.",
  alternates: { canonical: "/mon-sejour" },
};

export default async function MonSejourPage() {
  const [shortStay, week] = await Promise.all([
    buildTripPlan("48h"),
    buildTripPlan("7j"),
  ]);

  return (
    <>
      <PageHeader
        badge="Voyage"
        title="Mon séjour"
        description="Votre Moorea en un plan — marées, plages, restos et événements du moment."
        variant="soleil"
      />
      <Container className="py-12 sm:py-16 max-w-3xl">
        <MonSejourSwitch plans={{ "48h": shortStay, "7j": week }} />
        <p className="mt-8 text-center text-sm text-ocean-600">
          Besoin d&apos;infos pratiques ?{" "}
          <Link href="/qui-sait-quoi" className="font-semibold text-lagon-700 hover:underline">
            Qui sait quoi
          </Link>
          {" · "}
          <Link href="/guides" className="font-semibold text-lagon-700 hover:underline">
            Guides
          </Link>
        </p>
      </Container>
    </>
  );
}
