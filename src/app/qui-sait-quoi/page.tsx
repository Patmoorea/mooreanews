import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { listFaqByCategory, listFaqEntries } from "@/lib/faq";
import { faqPageJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Qui sait quoi — Infos utiles à Moorea",
  description:
    "Réponses courtes et à jour : démarches, santé, ferry, services — curatées par MooreaNews.",
  alternates: { canonical: "/qui-sait-quoi" },
};

export default async function QuiSaitQuoiPage() {
  const [groups, allEntries] = await Promise.all([
    listFaqByCategory(),
    listFaqEntries(),
  ]);

  return (
    <>
      <JsonLd
        data={faqPageJsonLd(
          allEntries.map((e) => ({
            question: e.question,
            answer: e.answer,
          })),
        )}
      />
      <PageHeader
        badge="Curaté"
        title="Qui sait quoi"
        description="Le fil Facebook utile, sans le chaos — fiches courtes validées par MooreaNews."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16 max-w-3xl">
        <p className="mb-8 text-sm text-ocean-600">
          Une question manquante ?{" "}
          <Link href="/soumettre" className="font-semibold text-lagon-700 hover:underline">
            Proposez une info
          </Link>
        </p>
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="font-display text-xl text-ocean-950 border-b border-ocean-100 pb-2">
                {group.label}
              </h2>
              <ul className="mt-4 space-y-4">
                {group.entries.map((entry) => (
                  <li
                    key={entry.slug}
                    id={entry.slug}
                    className="bg-white rounded-2xl border border-ocean-100 p-5 scroll-mt-36"
                  >
                    <h3 className="font-semibold text-ocean-900">{entry.question}</h3>
                    <p className="mt-2 text-sm text-ocean-700 leading-relaxed whitespace-pre-line">
                      {entry.answer}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-ocean-500">
                      {entry.district && (
                        <span className="px-2 py-0.5 rounded-full bg-lagon-50 text-lagon-800">
                          {entry.district}
                        </span>
                      )}
                      {entry.source_label && (
                        <span>{entry.source_label}</span>
                      )}
                      {entry.source_url && (
                        <a
                          href={entry.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lagon-700 hover:underline"
                        >
                          Source →
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
