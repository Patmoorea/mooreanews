import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { LocalAssistantClient } from "@/components/assistant/LocalAssistantClient";
import {
  ASSISTANT_SUGGESTIONS,
  searchLocalAssistant,
} from "@/lib/local-assistant";

export const metadata: Metadata = {
  title: "Assistant Moorea — infos vérifiées",
  description:
    "Trouvez médecin, ferry, marché, services — réponses depuis la FAQ et les infos pratiques MooreaNews uniquement.",
  alternates: { canonical: "/assistant" },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AssistantPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const { hits } = query.length >= 2 ? await searchLocalAssistant(query) : { hits: [] };

  return (
    <>
      <PageHeader
        badge="Sans invention"
        title="Assistant Moorea"
        description="Réponses uniquement depuis nos fiches vérifiées — FAQ et infos pratiques. Pas de ChatGPT, pas de devinette."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16 max-w-2xl">
        <LocalAssistantClient initialQuery={query} suggestions={ASSISTANT_SUGGESTIONS} />

        {query.length >= 2 && (
          <section className="mt-10">
            <h2 className="font-display text-lg text-ocean-950 mb-4">
              {hits.length > 0
                ? `${hits.length} résultat(s) pour « ${query} »`
                : `Aucune fiche pour « ${query} »`}
            </h2>
            {hits.length === 0 ? (
              <p className="text-sm text-ocean-600">
                Essayez un autre mot-clé, consultez{" "}
                <Link href="/qui-sait-quoi" className="text-lagon-700 font-semibold hover:underline">
                  Qui sait quoi
                </Link>{" "}
                ou{" "}
                <Link href="/infos-pratiques" className="text-lagon-700 font-semibold hover:underline">
                  Infos pratiques
                </Link>
                . Vous pouvez aussi{" "}
                <Link href="/signalements" className="text-lagon-700 font-semibold hover:underline">
                  signaler une info
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {hits.map((h) => (
                  <li key={`${h.kind}-${h.href}`}>
                    <Link
                      href={h.href}
                      className="block rounded-2xl border border-ocean-100 bg-white p-4 hover:border-lagon-300 transition-colors"
                    >
                      <span className="text-[10px] font-bold uppercase text-ocean-500">
                        {h.kind === "faq" ? "FAQ" : "Info pratique"}
                      </span>
                      <p className="font-semibold text-ocean-900 mt-1">{h.title}</p>
                      <p className="text-sm text-ocean-600 mt-1 line-clamp-2">{h.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </Container>
    </>
  );
}
