import type { Metadata } from "next";
import Link from "next/link";
import {
  METEO_VIGILANCE_MOOREA_PAGE,
  METEO_VIGILANCE_PAGE,
  fetchMeteoVigilance,
  PHENOMENON_LABELS,
} from "@/lib/meteo-vigilance";
import { syncMeteoVigilanceAlert } from "@/lib/meteo-vigilance-sync";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vigilance cyclone & météo — Moorea",
  description:
    "Mode cyclone MooreaNews : vigilance officielle, checklist et liens d'urgence.",
  alternates: { canonical: "/vigilance-cyclone" },
};

const CHECKLIST = [
  "Eau potable et nourriture pour 3 jours",
  "Radio / batteries / charge téléphone",
  "Documents et médicaments essentiels",
  "Sécuriser terrasse, vélos, objets légers",
  "Vérifier infos ferry et routes (MooreaNews Alertes)",
  "Suivre infoscyclones.pf et meteo.pf",
];

export default async function VigilanceCyclonePage() {
  await syncMeteoVigilanceAlert();
  let snapshot;
  try {
    snapshot = await fetchMeteoVigilance();
  } catch {
    snapshot = null;
  }

  const cycloneLevel = snapshot?.cycloneMaxColorId ?? 0;
  const mooreaLevel = snapshot?.mooreaMaxColorId ?? 0;
  const active = cycloneLevel >= 2 || mooreaLevel >= 3;

  return (
    <>
      <PageHeader
        badge={active ? "Vigilance active" : "Surveillance"}
        title="Mode cyclone & vigilance"
        description="Données officielles Météo France Polynésie — Moorea & Tahiti."
        variant={active ? "tiare" : "ocean"}
      />
      <Container className="py-12 sm:py-16 max-w-3xl">
        <div
          className={`rounded-2xl p-6 mb-8 border ${
            active
              ? "bg-tiare-50 border-tiare-300"
              : "bg-lagon-50 border-lagon-200"
          }`}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean-700">
            Niveau max Moorea
          </p>
          <p className="mt-2 font-display text-3xl text-ocean-950">
            {mooreaLevel === 0 ? "Vert — pas de vigilance" : `Niveau ${mooreaLevel}`}
          </p>
          {cycloneLevel > 0 && (
            <p className="mt-2 text-sm text-tiare-800">
              {PHENOMENON_LABELS[9] ?? "Cyclone"} : niveau {cycloneLevel}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={METEO_VIGILANCE_MOOREA_PAGE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-lagon-800 hover:underline"
            >
              Carte officielle Moorea →
            </a>
            <Link href="/alertes" className="text-sm font-semibold text-lagon-800 hover:underline">
              Alertes MooreaNews →
            </Link>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="font-display text-xl text-ocean-950 mb-4">Checklist préparation</h2>
          <ul className="space-y-2">
            {CHECKLIST.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-ocean-800 bg-white rounded-xl border border-ocean-100 px-4 py-3"
              >
                <span aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-ocean-950 mb-4">Liens officiels</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://www.infoscyclones.pf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lagon-700 font-semibold hover:underline"
              >
                infoscyclones.pf
              </a>
            </li>
            <li>
              <a
                href={METEO_VIGILANCE_PAGE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lagon-700 font-semibold hover:underline"
              >
                meteo.pf — vigilance
              </a>
            </li>
            <li>
              <Link href="/infos-pratiques" className="text-lagon-700 font-semibold hover:underline">
                Infos pratiques MooreaNews (CPS, urgences)
              </Link>
            </li>
          </ul>
        </section>
      </Container>
    </>
  );
}
