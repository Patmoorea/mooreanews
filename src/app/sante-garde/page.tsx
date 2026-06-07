import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { HealthOnCallPanel } from "@/components/health/HealthOnCallPanel";
import { getHealthOnCall } from "@/lib/health-on-call";

export const revalidate = 3600;

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
      <Container className="pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-tiare-700 mb-8"
        >
          <ArrowLeft size={14} />
          Retour à l&apos;accueil
        </Link>
        <HealthOnCallPanel data={data} variant="page" />
        <p className="mt-8 text-xs text-ocean-500 max-w-2xl">
          Garde du jour : appelez la <strong>DSP (40 47 01 44 / 47)</strong>.
          Les noms affichés proviennent du fichier{" "}
          <code className="text-[11px]">data/garde-moorea.json</code>, mis à jour
          chaque vendredi pour le week-end suivant. En cas de doute, contactez la{" "}
          <a
            href="https://www.facebook.com/CommuneMooreaMaiao"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            commune
          </a>
          .
        </p>
      </Container>
    </>
  );
}
