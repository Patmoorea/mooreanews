import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { QuickSignalementForm } from "@/components/signalements/QuickSignalementForm";
import { TelegramCommunityPromo } from "@/components/telegram/TelegramCommunityPromo";
import { dbListActiveAlerts } from "@/lib/supabase/queries";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Signalements — alertes locales",
  description:
    "Signalez accident, baleines, incendie, météo, route ou ferry — web ou Telegram, modération avant alerte push.",
  alternates: { canonical: "/signalements" },
};

export default async function SignalementsPage() {
  const alerts = (await dbListActiveAlerts()) ?? [];
  const community = alerts.filter(
    (a) =>
      a.type === "autre" ||
      a.type === "ferry" ||
      a.type === "route" ||
      a.title.toLowerCase().includes("signalement"),
  );

  return (
    <>
      <PageHeader
        badge="Communauté"
        title="Signalements"
        description="Accident, baleines, incendie, météo, route, ferry — vérifiés avant alerte push quartier."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto mb-8 -mt-2">
          <TelegramCommunityPromo variant="page" />
        </div>
        <div className="max-w-2xl mx-auto">
        <QuickSignalementForm />

        {community.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl text-ocean-950 mb-4">
              Alertes récentes (validées)
            </h2>
            <ul className="space-y-3">
              {community.slice(0, 8).map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-ocean-100 bg-white p-4"
                >
                  <p className="font-semibold text-ocean-900">
                    {a.urgent ? "🚨 " : ""}
                    {a.title}
                  </p>
                  {a.details && (
                    <p className="text-sm text-ocean-600 mt-1 line-clamp-3">{a.details}</p>
                  )}
                  <Link
                    href="/alertes"
                    className="text-xs text-lagon-700 font-semibold mt-2 inline-block hover:underline"
                  >
                    Toutes les alertes →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-10 text-sm text-ocean-600 text-center">
          <Link href="/alertes" className="text-lagon-700 font-semibold hover:underline">
            Recevoir les alertes par quartier
          </Link>
          {" · "}
          <Link href="/assistant" className="text-lagon-700 font-semibold hover:underline">
            Assistant Moorea
          </Link>
          {" · "}
          <Link href="/soumettre" className="text-lagon-700 font-semibold hover:underline">
            Autres soumissions
          </Link>
        </p>
        </div>
      </Container>
    </>
  );
}
