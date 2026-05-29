import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MapPin, Siren } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { expirePastAlerts } from "@/lib/alert-schedule";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alertes — Moorea",
  description:
    "Alertes temps réel à Moorea : EDT, eau, route, houle, ferry, météo.",
  alternates: { canonical: "/alertes" },
};

const TYPE_LABEL: Record<string, string> = {
  coupure_eau: "🚰 Coupure d’eau",
  coupure_edt: "⚡ Coupure EDT",
  route: "🚧 Route / travaux",
  houle: "🌊 Houle",
  ferry: "⛴ Ferry",
  meteo: "⛅ Météo",
  autre: "ℹ️ Autre",
};

export default async function AlertesPage() {
  await expirePastAlerts();
  const rows = (await dbListActiveAlerts()) ?? [];

  return (
    <>
      <PageHeader
        badge="Temps réel"
        title="Alertes à Moorea"
        description="Coupures, ferry, houle, météo : les infos utiles qui circulent vite."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        {rows.length === 0 ? (
          <div className="bg-white rounded-3xl border border-ocean-100 p-10 text-center">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-ocean-700 font-medium">
              Aucune alerte active pour le moment.
            </p>
            <p className="text-sm text-ocean-500 mt-1">
              Le bandeau BREAKING NEWS s’affiche automatiquement lorsqu’une alerte
              urgente est activée en admin.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((a) => (
              <article
                key={a.id}
                className="bg-white rounded-3xl border border-ocean-100 p-6 shadow-[var(--shadow-soft)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-ocean-600 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-ocean-50 border border-ocean-100">
                        <Siren size={12} className="text-tiare-600" />
                        {TYPE_LABEL[a.type] ?? a.type}
                      </span>
                      {a.urgent ? (
                        <span className="px-2 py-0.5 rounded-full bg-tiare-100 text-tiare-700 text-[10px] uppercase font-bold tracking-wide">
                          Breaking
                        </span>
                      ) : null}
                    </div>
                    <h2 className="font-display text-2xl text-ocean-950 truncate">
                      {a.title}
                    </h2>
                    {a.details ? (
                      <p className="mt-2 text-ocean-700 whitespace-pre-wrap">
                        {a.details}
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-ocean-600">
                      {a.district ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} />
                          {a.district}
                        </span>
                      ) : null}
                      {a.source_url ? (
                        <Link
                          href={a.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-lagon-700 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Source
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

