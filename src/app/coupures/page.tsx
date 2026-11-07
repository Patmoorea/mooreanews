import Link from "next/link";
import { ExternalLink, Droplets, Zap } from "lucide-react";
import {
  EDT_OUTAGES_PAGE,
  formatOutageWindow,
  getUtilityOutages,
  PDE_SOURCE_LABEL,
  type UtilityOutage,
} from "@/lib/utility-outages";
import { syncUtilityOutagesIfStale } from "@/lib/utility-outages-sync";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "Coupures programmées — EDT & eau",
  description:
    "Coupures d'électricité (EDT) et d'eau potable (Polynésienne des Eaux) programmées à Moorea — sources officielles.",
  alternates: { canonical: "/coupures" },
};

export const dynamic = "force-dynamic";

function OutageTable({
  outages,
  empty,
}: {
  outages: UtilityOutage[];
  empty: string;
}) {
  if (outages.length === 0) {
    return (
      <p className="text-sm text-ocean-600 py-6 text-center">{empty}</p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ocean-100 text-left text-xs uppercase tracking-wider text-ocean-500">
            <th className="py-3 px-2">Créneau</th>
            <th className="py-3 px-2">Lieu</th>
            <th className="py-3 px-2">Détails</th>
            <th className="py-3 px-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {outages.map((o) => (
            <tr
              key={o.id}
              className="border-b border-ocean-50 hover:bg-lagon-50/50"
            >
              <td className="py-3 px-2 whitespace-nowrap font-medium text-ocean-900">
                {formatOutageWindow(o.startsAt, o.endsAt)}
              </td>
              <td className="py-3 px-2 text-ocean-800">
                <span className="font-semibold block">
                  {o.district ?? o.commune ?? "Moorea"}
                </span>
                {o.area ? (
                  <span className="text-xs text-ocean-500 line-clamp-2">
                    {o.area}
                  </span>
                ) : null}
              </td>
              <td className="py-3 px-2 text-ocean-700 text-xs max-w-xs">
                {o.details ?? "—"}
              </td>
              <td className="py-3 px-2">
                <a
                  href={o.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-tiare-600 hover:underline text-xs inline-flex items-center gap-1"
                >
                  Voir
                  <ExternalLink size={12} />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function CoupuresPage() {
  void syncUtilityOutagesIfStale().catch(() => {});

  let schedule;
  let error: string | null = null;
  try {
    schedule = await getUtilityOutages();
  } catch (e) {
    error = String(e);
  }

  return (
    <>
      <PageHeader
        badge="Infos pratiques"
        title="Coupures programmées"
        description="Électricité (EDT) et eau potable (Polynésienne des Eaux) — Moorea et communes de l'île."
        variant="ocean"
      />
      <Container className="py-12 space-y-10">
        <div className="rounded-2xl border border-lagon-200 bg-lagon-50/80 p-5 text-sm text-ocean-800 leading-relaxed">
          <p>
            Données reprises automatiquement sur les sites officiels, plusieurs
            fois par jour. Les coupures à venir apparaissent aussi sur la page{" "}
            <Link href="/alertes" className="text-tiare-700 font-semibold hover:underline">
              Alertes
            </Link>
            .
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-tiare-200 bg-tiare-50 p-6 text-ocean-800">
            <p className="font-semibold">Sources temporairement indisponibles</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
        ) : schedule ? (
          <>
            <section className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
                    <Zap size={22} />
                    Coupures EDT — électricité
                  </h2>
                  <p className="text-sm text-ocean-600 mt-1">
                    {schedule.edt.length} coupure(s) prévue(s) sur Moorea
                  </p>
                </div>
                <a
                  href={EDT_OUTAGES_PAGE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tiare-600 hover:underline inline-flex items-center gap-1"
                >
                  edt.pf
                  <ExternalLink size={12} />
                </a>
              </div>
              <OutageTable
                outages={schedule.edt}
                empty="Aucune coupure EDT programmée à Moorea dans la période affichée."
              />
            </section>

            <section className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                <div>
                  <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
                    <Droplets size={22} />
                    Coupures d&apos;eau
                  </h2>
                  <p className="text-sm text-ocean-600 mt-1">
                    {schedule.water.length} avis {PDE_SOURCE_LABEL} pour Moorea
                  </p>
                </div>
                <a
                  href="https://www.polynesienne-des-eaux.pf/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-tiare-600 hover:underline inline-flex items-center gap-1"
                >
                  polynesienne-des-eaux.pf
                  <ExternalLink size={12} />
                </a>
              </div>
              <OutageTable
                outages={schedule.water}
                empty="Aucune coupure d'eau programmée à Moorea pour l'instant."
              />
            </section>

            <p className="text-xs text-ocean-500 text-center">
              Dernière synchro MooreaNews :{" "}
              {new Date(schedule.fetchedAt).toLocaleString("fr-FR", {
                timeZone: "Pacific/Tahiti",
              })}{" "}
              (heure Tahiti)
            </p>
          </>
        ) : null}

        <p className="text-center">
          <Link href="/alertes" className="text-lagon-700 font-semibold hover:underline">
            ← Toutes les alertes Moorea
          </Link>
        </p>
      </Container>
    </>
  );
}
