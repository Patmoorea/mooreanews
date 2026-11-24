import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { LocalAssistantClient } from "@/components/assistant/LocalAssistantClient";
import { ASSISTANT_SUGGESTIONS } from "@/lib/local-assistant";

/** Coquille statique. `?q=` est traité dans le navigateur via /api/assistant/search. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Assistant Moorea — infos vérifiées",
  description:
    "Trouvez médecin, ferry, marché, services — réponses depuis la FAQ et les infos pratiques MooreaNews uniquement.",
  alternates: { canonical: "/assistant" },
};

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        badge="Sans invention"
        title="Assistant Moorea"
        description="Réponses uniquement depuis nos fiches vérifiées — FAQ et infos pratiques. Pas de ChatGPT, pas de devinette."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16 max-w-2xl">
        <LocalAssistantClient suggestions={ASSISTANT_SUGGESTIONS} />
      </Container>
    </>
  );
}
