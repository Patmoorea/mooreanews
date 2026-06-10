import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { AlertesListClient } from "@/components/alerts/AlertesListClient";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { expirePastAlerts } from "@/lib/alert-schedule";
import { expireStaleAnnouncements } from "@/lib/announcement-expiry";
import { syncMeteoVigilanceAlertIfStale } from "@/lib/meteo-vigilance-sync";
import { syncUtilityOutagesIfStale } from "@/lib/utility-outages-sync";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alertes — Moorea",
  description:
    "Alertes temps réel à Moorea : EDT, eau, route, houle, ferry, météo — par quartier.",
  alternates: { canonical: "/alertes" },
};

export default async function AlertesPage() {
  await expirePastAlerts().catch(() => 0);

  // Syncs externes (~30s) en arrière-plan — sinon timeout navigateur sur /alertes
  void Promise.all([
    syncMeteoVigilanceAlertIfStale(),
    syncUtilityOutagesIfStale(),
    expireStaleAnnouncements().catch(() => 0),
  ]);

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
        <AlertesListClient alerts={rows} />
      </Container>
    </>
  );
}
