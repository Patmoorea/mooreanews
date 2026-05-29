import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Ferry Tahiti ↔ Moorea — Guide",
  description:
    "Horaires Aremiti, Tauati, Vaeara'i. Conseils pour traverser entre Papeete et Moorea.",
  alternates: { canonical: "/guides/ferry-tahiti-moorea" },
};

export default function FerryGuidePage() {
  return (
    <>
      <PageHeader
        badge="Guide"
        title="Ferry Tahiti ↔ Moorea"
        description="Tout ce qu'il faut savoir pour la traversée — horaires live sur MooreaNews."
        variant="lagon"
      />
      <Container className="py-12 max-w-3xl prose prose-ocean">
        <article className="bg-white rounded-3xl border border-ocean-100 p-8 space-y-6 text-ocean-800">
          <section>
            <h2 className="font-display text-2xl text-ocean-950">Les 3 compagnies</h2>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong>Aremiti</strong> — liaison régulière Papeete ↔ Vaiare</li>
              <li><strong>Tauati (Terevau)</strong> — horaires variables selon saison</li>
              <li><strong>Vaeara&apos;i</strong> — alternative fréquente côté est</li>
            </ul>
          </section>
          <section>
            <h2 className="font-display text-2xl text-ocean-950">Conseils pratiques</h2>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Arrivez <strong>20–30 min avant</strong> le départ en haute saison</li>
              <li>Vérifiez les horaires le jour même (météo, houle)</li>
              <li>Gardez une pièce d&apos;identité pour l&apos;embarquement</li>
            </ul>
          </section>
          <p>
            <Link href="/#en-direct" className="text-lagon-700 font-semibold hover:underline">
              → Horaires ferries en direct sur MooreaNews
            </Link>
          </p>
          <p>
            <Link href="/app" className="text-lagon-700 font-semibold hover:underline">
              → Mode app (résumé + lien site)
            </Link>
          </p>
        </article>
      </Container>
    </>
  );
}
