import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { HealthOnCallPanel } from "@/components/health/HealthOnCallPanel";
import { AdSlot } from "@/components/ads/AdSlot";
import { getHealthOnCall } from "@/lib/health-on-call";
import { COPPF_MEDECINS_GARDE_URL } from "@/lib/garde-ordre-pharmaciens";
import { MOOREA_PHARMACIES } from "@/data/pharmacies-moorea";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pharmacie & médecin de garde — Moorea",
  description:
    "Pharmacie et médecin de garde à Moorea le week-end. DSP 40 47 01 44.",
  alternates: { canonical: "/sante-garde" },
};

export default async function SanteGardePage() {
  const data = await getHealthOnCall();

  return (
    <>
      <PageHeader
        badge="Santé"
        title="Pharmacie & médecin de garde"
        description="Week-end et jours fériés — Moorea uniquement."
      />
      <AdSlot slotId="sante-garde-mid" fullBleed />
      <Container className="pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-tiare-700 mb-8"
        >
          <ArrowLeft size={14} />
          Retour à l&apos;accueil
        </Link>
        <HealthOnCallPanel data={data} variant="page" />
        <section className="mt-10">
          <h2 className="font-display text-2xl text-ocean-950">Les pharmacies de Moorea</h2>
          <p className="mt-1 text-sm text-ocean-600 max-w-2xl">
            Horaires habituels. La pharmacie de garde du week-end est mise en avant
            seulement quand une annonce cite le samedi et le dimanche en cours.
          </p>
          <ul className="mt-4 grid gap-4 lg:grid-cols-3">
            {MOOREA_PHARMACIES.map((pharmacy) => {
              const onDuty = data.onDutyPharmacy?.name === pharmacy.name;
              return (
                <li
                  key={pharmacy.id}
                  className={
                    onDuty
                      ? "rounded-2xl border-2 border-tiare-500 bg-tiare-50 p-4 shadow-sm"
                      : "rounded-2xl border border-ocean-100 bg-white p-4"
                  }
                >
                  {onDuty ? (
                    <p className="text-xs font-bold uppercase tracking-wide text-tiare-700">
                      De garde ce week-end
                    </p>
                  ) : null}
                  <h3 className="font-semibold text-ocean-950">{pharmacy.name}</h3>
                  <p className="mt-1 text-sm text-ocean-700">{pharmacy.address}</p>
                  <a href={pharmacy.phoneHref} className="mt-2 inline-block font-bold text-tiare-600">
                    {pharmacy.phone}
                  </a>
                  <p className="mt-2 text-sm text-ocean-800">{pharmacy.hoursLabel}</p>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ocean-500">
                    {pharmacy.sources.map((source) => (
                      <a
                        key={source.href}
                        href={source.href}
                        className="underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.label}
                      </a>
                    ))}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
        <p className="mt-8 text-xs text-ocean-500 max-w-2xl">
          Médecin :{" "}
          <a
            href={COPPF_MEDECINS_GARDE_URL}
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            tableau de l&apos;Ordre des médecins
          </a>
          . Pharmacie de garde : commune de Moorea-Maiao ou autre source citée, quand elle est publiée.
        </p>
      </Container>
    </>
  );
}
