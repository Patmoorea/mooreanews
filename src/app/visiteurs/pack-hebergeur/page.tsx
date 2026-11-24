import type { Metadata } from "next";
import Link from "next/link";
import { PrintPackButton } from "@/components/visiteurs/PrintPackButton";
import { VisitorsQrSection } from "@/components/visiteurs/VisitorsQrSection";
import { Container } from "@/components/ui/Container";
import { RAI_TAHITI, SITE } from "@/lib/constants";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Pack hébergeur — MooreaNews",
  description:
    "Document à imprimer pour vos invités : ferry, urgences, QR MooreaNews, plages.",
  alternates: { canonical: "/visiteurs/pack-hebergeur" },
};

export default async function PackHebergeurPage() {
  const digest = await getMooreaDuJour();
  const ferry = digest.ferries.fromTahiti[0];

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <Container className="py-10 max-w-3xl print:py-4 print:max-w-none">
        <div className="no-print mb-8 flex flex-wrap gap-3">
          <PrintPackButton />
          <Link
            href="/visiteurs"
            className="px-4 py-2 rounded-full border border-ocean-200 text-sm font-semibold"
          >
            ← Retour visiteurs
          </Link>
        </div>

        <article className="print:text-black space-y-8">
          <header className="border-b border-ocean-200 pb-6">
            <p className="text-sm uppercase tracking-widest text-ocean-500">
              Pack invités
            </p>
            <h1 className="font-display text-3xl text-ocean-950 mt-2">
              {SITE.name} — Moorea
            </h1>
            <p className="mt-2 text-ocean-700">
              Info locale en temps réel : ferries, plages, alertes, agenda.
            </p>
          </header>

          <section>
            <h2 className="font-display text-xl text-ocean-950 mb-4">
              QR codes (scan smartphone)
            </h2>
            <VisitorsQrSection />
          </section>

          <section className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <h2 className="font-semibold text-ocean-950 mb-2">⛴ Ferry aujourd&apos;hui</h2>
              <p>
                {ferry
                  ? `Prochain Tahiti → Moorea : ${ferry.time} (${ferry.company})`
                  : "Consultez mooreanews.com — section En direct"}
              </p>
              <p className="mt-2 text-ocean-600">
                Réservez véhicule à l&apos;avance en haute saison.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-ocean-950 mb-2">🌊 Lagon</h2>
              <p>
                {digest.swim.emoji} {digest.swim.label} — {digest.weather.temp}°C
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-ocean-950 mb-2">🚨 Urgences</h2>
              <ul className="space-y-1 text-ocean-700">
                <li>Pompiers / SAMU : 18</li>
                <li>Police : 17</li>
                <li>Hôpital Afareaitu — infos pratiques sur le site</li>
                <li>
                  RAI TAHITI VSL :{" "}
                  <a href={RAI_TAHITI.phoneHref}>{RAI_TAHITI.phoneMoorea}</a>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="font-semibold text-ocean-950 mb-2">📅 Pendant le séjour</h2>
              <ul className="space-y-1 text-ocean-700">
                <li>Agenda : mooreanews.com/evenements</li>
                <li>Ce soir : mooreanews.com/ce-soir</li>
                <li>Mon séjour 48h : mooreanews.com/mon-sejour</li>
              </ul>
            </div>
          </section>

          <footer className="border-t border-ocean-200 pt-4 text-xs text-ocean-500 print:fixed print:bottom-4 print:left-4 print:right-4">
            Document {SITE.name} — {SITE.url} — à renouveler : les horaires ferry
            et alertes changent en continu, invitez vos clients à scanner le QR.
          </footer>
        </article>
      </Container>
    </div>
  );
}
