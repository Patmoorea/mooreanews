import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "48h à Moorea — Guide",
  description:
    "Que faire en 2 jours à Moorea : famille, plongée, budget. Liens vers le site complet.",
  alternates: { canonical: "/guides/48h-moorea" },
};

export default function Guide48hPage() {
  return (
    <>
      <PageHeader
        badge="Guide"
        title="48h à Moorea"
        description="Trois idées de séjour — détail et agenda à jour sur MooreaNews."
        variant="tiare"
      />
      <Container className="py-12 max-w-3xl">
        <div className="grid gap-6">
          {[
            {
              title: "Famille",
              items: ["Plage Temae & lagon", "Belvédère rotui", "Marché / roulottes Paopao"],
            },
            {
              title: "Plongée & lagon",
              items: ["Snorkel Tiahura", "Sortie baleines (saison)", "Vérifier marées du jour"],
            },
            {
              title: "Budget",
              items: ["Roulottes locales", "Bus / location vélo", "Événements gratuits"],
            },
          ].map((block) => (
            <article
              key={block.title}
              className="bg-white rounded-2xl border border-ocean-100 p-6"
            >
              <h2 className="font-display text-xl text-ocean-950">{block.title}</h2>
              <ul className="mt-3 list-disc pl-5 text-ocean-700 space-y-1">
                {block.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/evenements" className="text-lagon-700 font-semibold hover:underline">
            Voir l&apos;agenda complet →
          </Link>
        </p>
      </Container>
    </>
  );
}
