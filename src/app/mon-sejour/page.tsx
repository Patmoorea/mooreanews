import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { TripPlanClient } from "@/components/trip/TripPlanClient";
import { buildTripPlan } from "@/lib/mon-sejour";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon séjour à Moorea",
  description:
    "Itinéraire personnalisé 48h ou 7 jours : plages, ferry, restaurants, événements.",
  alternates: { canonical: "/mon-sejour" },
};

type Props = {
  searchParams: Promise<{ duree?: string }>;
};

export default async function MonSejourPage({ searchParams }: Props) {
  const params = await searchParams;
  const duration = params.duree === "7j" ? "7j" : "48h";
  const plan = await buildTripPlan(duration);

  return (
    <>
      <PageHeader
        badge="Voyage"
        title="Mon séjour"
        description="Votre Moorea en un plan — marées, plages, restos et événements du moment."
        variant="soleil"
      />
      <Container className="py-12 sm:py-16 max-w-3xl">
        <div className="flex gap-2 mb-8">
          <Link
            href="/mon-sejour"
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              duration === "48h"
                ? "bg-ocean-900 text-white"
                : "bg-ocean-50 text-ocean-800 border border-ocean-100"
            }`}
          >
            48 heures
          </Link>
          <Link
            href="/mon-sejour?duree=7j"
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              duration === "7j"
                ? "bg-ocean-900 text-white"
                : "bg-ocean-50 text-ocean-800 border border-ocean-100"
            }`}
          >
            7 jours
          </Link>
        </div>
        <TripPlanClient plan={plan} />
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
