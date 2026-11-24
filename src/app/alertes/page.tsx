import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { AlertesListClient } from "@/components/alerts/AlertesListClient";
import { TelegramCommunityPromo } from "@/components/telegram/TelegramCommunityPromo";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

/**
 * Repli 1 h. Les crons alertes / météo / coupures appellent revalidatePath("/alertes").
 * L'expiration et la synchro ne tournent plus à chaque visite.
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Alertes — Moorea",
  description:
    "Alertes temps réel à Moorea : EDT, eau, route, houle, ferry, météo — par quartier.",
  alternates: { canonical: "/alertes" },
};

export default async function AlertesPage() {
  const rows = (await dbListActiveAlerts()) ?? [];

  return (
    <>
      <PageHeader
        badge="Temps réel"
        title="Alertes à Moorea"
        description="Coupures, ferry, houle, météo — abonnez-vous par quartier (push ou email)."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-10">
          <TelegramCommunityPromo variant="page" />
        </div>
        <AlertesListClient alerts={rows} />
      </Container>
    </>
  );
}
