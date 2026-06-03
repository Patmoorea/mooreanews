import Link from "next/link";
import { ExternalLink, Ship, Users, Anchor } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import {
  checkDpamStatsFreshness,
  formatPercentChange,
  formatTrafficNumber,
  getLatestMooreaComparison,
  getMaritimeTrafficData,
  getTrafficYears,
} from "@/lib/maritime-traffic";

export const metadata = {
  title: "Trafic ferry Tahiti–Moorea & tourisme",
  description:
    "Passagers ferry Tahiti–Moorea par navire (DPAM 2024–2025), trafic maritime polynésien, touristes et croisiéristes en Polynésie française.",
  alternates: { canonical: "/trafic-ferry" },
};

export const dynamic = "force-dynamic";

function ChangeBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const label = formatPercentChange(current, previous);
  const up = current >= previous;
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
        up ? "bg-tipanier-100 text-tipanier-800" : "bg-lagon-100 text-lagon-800"
      }`}
    >
      {label}
    </span>
  );
}

export default async function TraficFerryPage() {
  const data = getMaritimeTrafficData();
  const years = getTrafficYears().slice(0, 2);
  const { current, previous } = getLatestMooreaComparison();
  const freshness = await checkDpamStatsFreshness().catch(() => null);

  const tourismYears = years.filter((y) => data.tourism.years[String(y)]);

  const vesselNames = [
    ...new Set(
      years.flatMap(
        (y) =>
          data.mooreaLine.years[String(y)]?.vessels.map((v) => v.name) ?? [],
      ),
    ),
  ];

  return (
    <>
      <PageHeader
        badge="Chiffres officiels"
        title="Trafic ferry & tourisme"
        description="Passagers Tahiti–Moorea par navire (DPAM), trafic maritime en Polynésie et fréquentation touristique (ISPF)."
        variant="ocean"
      />
      <Container className="py-12 space-y-12">
        {freshness?.needsUpdate ? (
          <div className="rounded-2xl border border-soleil-200 bg-soleil-50 p-4 text-sm text-ocean-800">
            Nouveau rapport DPAM {freshness.latestPdfYear} détecté — mise à jour
            des chiffres MooreaNews en cours.
          </div>
        ) : null}

        {/* Moorea line summary */}
        <section className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
                <Ship size={22} />
                {data.mooreaLine.label}
              </h2>
              <p className="text-sm text-ocean-600 mt-1 max-w-2xl">
                {data.mooreaLine.note}
              </p>
            </div>
            <a
              href={data.sources.dpam.page}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-tiare-600 hover:underline inline-flex items-center gap-1"
            >
              {data.sources.dpam.label}
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {years.map((year) => {
              const y = data.mooreaLine.years[String(year)];
              if (!y) return null;
              const prevYear = year - 1;
              const prev = data.mooreaLine.years[String(prevYear)];
              return (
                <div
                  key={year}
                  className="rounded-2xl border border-ocean-100 bg-lagon-50/50 p-5"
                >
                  <p className="text-xs uppercase tracking-widest text-ocean-500 font-semibold">
                    Total {year}
                  </p>
                  <p className="text-3xl font-display text-ocean-950 tabular-nums mt-1">
                    {formatTrafficNumber(y.totalPassengers)}
                  </p>
                  <p className="text-sm text-ocean-600 mt-1">passagers</p>
                  {prev ? (
                    <div className="mt-3">
                      <ChangeBadge
                        current={y.totalPassengers}
                        previous={prev.totalPassengers}
                      />
                      <span className="text-xs text-ocean-500 ml-2">
                        vs {prevYear}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <h3 className="font-semibold text-ocean-900 mb-4">
            Passagers par navire — comparaison {years.join(" / ")}
          </h3>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-ocean-100 text-left text-xs uppercase tracking-wider text-ocean-500">
                  <th className="py-3 px-2">Navire</th>
                  {years.map((y) => (
                    <th key={y} className="py-3 px-2 text-right">
                      {y}
                    </th>
                  ))}
                  {years.length === 2 ? (
                    <th className="py-3 px-2 text-right">Évolution</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {vesselNames.map((name) => {
                  const curYearV = current.data.vessels.find(
                    (c) => c.name === name,
                  );
                  const prevYearData = previous?.data.vessels.find(
                    (p) => p.name === name,
                  );
                  return (
                    <tr
                      key={name}
                      className="border-b border-ocean-50 hover:bg-lagon-50/40"
                    >
                      <td className="py-3 px-2 font-medium text-ocean-950">
                        {name}
                      </td>
                      {years.map((year) => {
                        const row = data.mooreaLine.years[String(year)];
                        const vessel = row?.vessels.find((x) => x.name === name);
                        return (
                          <td
                            key={year}
                            className="py-3 px-2 text-right tabular-nums text-ocean-800"
                          >
                            {vessel
                              ? formatTrafficNumber(vessel.passengers)
                              : "—"}
                          </td>
                        );
                      })}
                      {years.length === 2 && curYearV && prevYearData ? (
                        <td className="py-3 px-2 text-right">
                          <ChangeBadge
                            current={curYearV.passengers}
                            previous={prevYearData.passengers}
                          />
                        </td>
                      ) : years.length === 2 ? (
                        <td className="py-3 px-2 text-right">—</td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-ocean-50 font-semibold text-ocean-900">
                  <td className="py-3 px-2">Total ligne</td>
                  {years.map((year) => (
                    <td key={year} className="py-3 px-2 text-right tabular-nums">
                      {formatTrafficNumber(
                        data.mooreaLine.years[String(year)].totalPassengers,
                      )}
                    </td>
                  ))}
                  {years.length === 2 && previous ? (
                    <td className="py-3 px-2 text-right">
                      <ChangeBadge
                        current={current.data.totalPassengers}
                        previous={previous.data.totalPassengers}
                      />
                    </td>
                  ) : null}
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Tourism */}
        <section className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
                <Users size={22} />
                {data.tourism.label}
              </h2>
              <p className="text-sm text-ocean-600 mt-1 max-w-2xl">
                {data.tourism.note}
              </p>
            </div>
            <a
              href={data.sources.ispfTourism.page}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-tiare-600 hover:underline inline-flex items-center gap-1"
            >
              {data.sources.ispfTourism.label}
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-ocean-100 text-left text-xs uppercase tracking-wider text-ocean-500">
                  <th className="py-3 px-2">Indicateur</th>
                  {tourismYears.map((y) => (
                    <th key={y} className="py-3 px-2 text-right">
                      {y}
                    </th>
                  ))}
                  {tourismYears.length === 2 ? (
                    <th className="py-3 px-2 text-right">Évolution</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Touristes (total)", "tourists"],
                    ["Croisiéristes", "cruisePassengers"],
                    ["Hébergement terrestre", "landTourists"],
                    ["Visiteurs (toutes catégories)", "visitors"],
                  ] as const
                ).map(([label, key]) => {
                  const vals = tourismYears.map(
                    (y) => data.tourism.years[String(y)][key] as number | undefined,
                  );
                  if (vals.every((v) => v == null)) return null;
                  return (
                    <tr
                      key={key}
                      className="border-b border-ocean-50 hover:bg-lagon-50/40"
                    >
                      <td className="py-3 px-2 text-ocean-900">{label}</td>
                      {vals.map((v, i) => (
                        <td
                          key={tourismYears[i]}
                          className="py-3 px-2 text-right tabular-nums"
                        >
                          {v != null ? formatTrafficNumber(v) : "—"}
                        </td>
                      ))}
                      {tourismYears.length === 2 &&
                      vals[0] != null &&
                      vals[1] != null ? (
                        <td className="py-3 px-2 text-right">
                          <ChangeBadge current={vals[0]} previous={vals[1]} />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* PF maritime total */}
        <section className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2 mb-4">
            <Anchor size={22} />
            {data.polynesiaMaritime.label}
          </h2>
          <p className="text-sm text-ocean-600 mb-6">{data.polynesiaMaritime.note}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {years.map((year) => {
              const row = data.polynesiaMaritime.years[String(year)];
              if (!row) return null;
              return (
                <div
                  key={year}
                  className="rounded-2xl border border-ocean-100 p-5"
                >
                  <p className="text-xs uppercase text-ocean-500 font-semibold">
                    {year}
                  </p>
                  <p className="text-2xl font-display text-ocean-950 tabular-nums mt-1">
                    {formatTrafficNumber(row.totalPassengers)}
                  </p>
                  <p className="text-sm text-ocean-600">passagers inter-îles</p>
                </div>
              );
            })}
          </div>
        </section>

        <p className="text-xs text-ocean-500 text-center">
          Dernière vérification MooreaNews : {data.updatedAt} · PDF{" "}
          {years.join(", ")} sur{" "}
          <a
            href={data.sources.dpam.page}
            className="text-tiare-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            service-public.pf/dpam
          </a>
        </p>

        <p className="text-center">
          <Link href="/#en-direct" className="text-lagon-700 font-semibold hover:underline">
            ← Horaires ferries en direct
          </Link>
        </p>
      </Container>
    </>
  );
}
