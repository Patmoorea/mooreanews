import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Ship,
  Waves,
  Calendar,
  Map,
  FileDown,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { VisitorsQrSection } from "@/components/visiteurs/VisitorsQrSection";
import { AccommodationsList } from "@/components/visiteurs/AccommodationsList";
import { BeachTidePanel } from "@/components/visiteurs/BeachTidePanel";
import { TouristMapSection } from "@/components/visiteurs/TouristMapSection";
import { VisitorMonetizationSection } from "@/components/visiteurs/VisitorMonetizationSection";
import { getVisitorAccommodations } from "@/lib/accommodations";
import { getBeachTideSlots } from "@/lib/beach-tide-slots";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { buildTouristMapMarkers } from "@/lib/tourist-map-markers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Visiteurs — Moorea",
  description:
    "Guide visiteur Moorea : hébergements, plages, ferries, agenda, carte et QR pour hôtels et ferry.",
  alternates: { canonical: "/visiteurs" },
};

export default async function VisiteursPage() {
  const [digest, accommodations, beachSlots, mapMarkers] = await Promise.all([
    getMooreaDuJour(),
    getVisitorAccommodations(),
    getBeachTideSlots(),
    buildTouristMapMarkers(),
  ]);

  const ferry = digest.ferries.fromTahiti[0] ?? digest.ferries.fromMoorea[0];

  return (
    <>
      <PageHeader
        badge="Tourisme"
        title="Bienvenue à Moorea"
        description="L'info des locaux pour visiter l'île — ferries, plages, hébergements et agenda en temps réel."
        variant="soleil"
      />
      <Container className="py-12 sm:py-16 space-y-14">
        {/* Digest rapide */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-ocean-100 p-4">
            <Ship size={18} className="text-lagon-600 mb-2" />
            <p className="text-xs uppercase text-ocean-500 font-semibold">Ferry</p>
            <p className="font-semibold text-ocean-900">
              {ferry ? `${ferry.time} ${ferry.company}` : "Voir horaires"}
            </p>
            <Link href="/#en-direct" className="text-xs text-lagon-700 hover:underline">
              En direct →
            </Link>
          </div>
          <div className="rounded-2xl bg-white border border-ocean-100 p-4">
            <Waves size={18} className="text-lagon-600 mb-2" />
            <p className="text-xs uppercase text-ocean-500 font-semibold">Lagon</p>
            <p className="font-semibold text-ocean-900">
              {digest.swim.emoji} {digest.swim.label}
            </p>
            <p className="text-xs text-ocean-500">{digest.weather.temp}°C</p>
          </div>
          <div className="rounded-2xl bg-white border border-ocean-100 p-4">
            <Calendar size={18} className="text-tiare-600 mb-2" />
            <p className="text-xs uppercase text-ocean-500 font-semibold">Agenda</p>
            <p className="font-semibold text-ocean-900">
              {digest.todayEvents[0]?.title ?? `${digest.weekendEvents.length} event(s) week-end`}
            </p>
            <Link href="/evenements" className="text-xs text-lagon-700 hover:underline">
              Filtrer par dates →
            </Link>
          </div>
          <div className="rounded-2xl bg-white border border-ocean-100 p-4">
            <Map size={18} className="text-tipanier-600 mb-2" />
            <p className="text-xs uppercase text-ocean-500 font-semibold">Séjour</p>
            <Link
              href="/mon-sejour"
              className="font-semibold text-ocean-900 hover:text-lagon-700 inline-flex items-center gap-1"
            >
              Plan 48h / 7j <ArrowRight size={14} />
            </Link>
            <Link href="/ce-soir" className="block text-xs text-lagon-700 hover:underline mt-1">
              Ce soir à Moorea →
            </Link>
          </div>
        </section>

        {/* QR hôtels / ferry */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-ocean-950">
                QR codes à afficher
              </h2>
              <p className="text-sm text-ocean-600 mt-1">
                Réception pension, comptoir ferry, flyer hôtel — scan = info à jour.
              </p>
            </div>
            <Link
              href="/visiteurs/pack-hebergeur"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ocean-200 text-sm font-semibold text-ocean-800 hover:bg-ocean-50"
            >
              <FileDown size={16} />
              Pack PDF hébergeur
            </Link>
          </div>
          <VisitorsQrSection />
        </section>

        {/* Hébergements */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-ocean-950">
                Où dormir à Moorea
              </h2>
              <p className="text-sm text-ocean-600 mt-1">
                Hôtels, pensions et fares — annonces location signalées en temps réel.
                Disponibilité : contactez l&apos;établissement ou l&apos;annonceur.
              </p>
            </div>
            <Link
              href="/annonces"
              className="text-sm font-semibold text-lagon-700 hover:underline"
            >
              Toutes les annonces →
            </Link>
          </div>
          <AccommodationsList items={accommodations} />
        </section>

        <BeachTidePanel slots={beachSlots} />

        <TouristMapSection markers={mapMarkers} />

        <VisitorMonetizationSection />

        <section className="text-center text-sm text-ocean-600">
          <Link href="/qui-sait-quoi" className="text-lagon-700 font-semibold hover:underline">
            Qui sait quoi
          </Link>
          {" · "}
          <Link href="/guides" className="text-lagon-700 font-semibold hover:underline">
            Guides
          </Link>
          {" · "}
          <Link href="/vigilance-cyclone" className="text-lagon-700 font-semibold hover:underline">
            Vigilance cyclone
          </Link>
        </section>
      </Container>
    </>
  );
}
