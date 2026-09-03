import type { Metadata } from "next";
import Link from "next/link";
import {
  Bus,
  ExternalLink,
  MapPin,
  Ticket,
  Clock,
  AlertCircle,
  Shield,
  Ban,
  Lightbulb,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { BusCard } from "@/components/widgets/BusCard";
import {
  getNextBusDepartures,
  loadBusScheduleData,
  getLineSchedule,
  formatBusScheduleTime,
  isBusSchoolTermDeparture,
  type BusLineId,
  type BusDayKind,
} from "@/lib/buses";

export const metadata: Metadata = {
  title: "Bus Moorea — Transport public J.RUTA",
  description:
    "Horaires, tarifs et lignes du réseau de bus Moorea (Tiahura ↔ Vaiare). 4 lignes, lun–sam. Infos officielles Transport Public Moorea.",
  alternates: { canonical: "/bus-moorea" },
};

export const revalidate = 120;

const LINE_IDS: BusLineId[] = ["L1", "L2", "L3", "L4"];

const DAY_LABELS: Record<BusDayKind, string> = {
  week: "Lundi – vendredi",
  sat: "Samedi",
};

function OfficialSiteBanner({
  url,
  label,
}: {
  url: string;
  label: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 p-6 sm:p-8 text-white shadow-lg hover:border-emerald-400/50 hover:shadow-xl transition-all"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
        <Bus size={28} className="text-emerald-100" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/90">
          Site officiel — Commune de Moorea-Maiao
        </p>
        <p className="mt-1 font-display text-2xl sm:text-3xl text-white">
          {label}
        </p>
        <p className="mt-2 text-sm text-emerald-100/90">
          Horaires détaillés par secteur, carte du réseau, tarifs et annonces
          de service — source officielle J.RUTA Transport.
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-emerald-900 group-hover:bg-emerald-50 transition-colors">
        Ouvrir le site officiel
        <ExternalLink size={16} aria-hidden />
      </span>
    </a>
  );
}

function ScheduleBlock({
  lineId,
  dayKind,
  stops,
  rows,
}: {
  lineId: BusLineId;
  dayKind: BusDayKind;
  stops: string[];
  rows: string[][];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-ocean-100 overflow-hidden">
      <div className="bg-ocean-50 px-4 py-2.5 border-b border-ocean-100">
        <p className="text-xs font-bold uppercase tracking-wider text-ocean-600">
          {DAY_LABELS[dayKind]}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-ocean-100 text-left text-[11px] uppercase tracking-wider text-ocean-500">
              <th className="py-2.5 px-3 font-semibold">Départ</th>
              {stops.slice(1).map((stop) => (
                <th key={stop} className="py-2.5 px-2 font-semibold whitespace-nowrap">
                  {stop}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const depRaw = row[0] ?? "";
              return (
                <tr
                  key={`${lineId}-${dayKind}-${i}`}
                  className="border-b border-ocean-50 hover:bg-emerald-50/40"
                >
                  <td className="py-2.5 px-3 font-bold tabular-nums text-ocean-950 whitespace-nowrap">
                    {formatBusScheduleTime(depRaw)}
                    {isBusSchoolTermDeparture(depRaw) ? (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        scolaire
                      </span>
                    ) : null}
                  </td>
                  {row.slice(1).map((t, j) => (
                    <td
                      key={`${i}-${j}`}
                      className="py-2.5 px-2 tabular-nums text-ocean-700 whitespace-nowrap"
                    >
                      {formatBusScheduleTime(t)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function BusMooreaPage() {
  const [{ data, source }, live] = await Promise.all([
    loadBusScheduleData(),
    getNextBusDepartures(),
  ]);

  const meta = data.meta;
  const officialUrl =
    meta.officialSiteUrl ?? "https://mooreatransportpublic.com";

  return (
    <>
      <PageHeader
        badge="Transport public"
        title="Bus Moorea"
        description={`Réseau de 4 lignes entre Tiahura et Vaiare — ${meta.operator}, pour le compte de la ${meta.authority}.`}
        variant="tipanier"
      />

      <Container className="py-10 sm:py-12 space-y-10">
        <OfficialSiteBanner url={officialUrl} label="mooreatransportpublic.com" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
              <Clock size={22} className="text-emerald-600" />
              Prochains départs aujourd&apos;hui
            </h2>
            <BusCard />
          </div>

          <aside className="space-y-4">
            <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
              <Ticket size={22} className="text-emerald-600" />
              Tarifs
            </h2>
            <div className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)] space-y-4">
              <p className="text-sm text-ocean-600">
                Même tarification sur l&apos;ensemble des lignes du réseau.
              </p>
              <ul className="space-y-3">
                {meta.fares.map((f) => (
                  <li
                    key={f.label}
                    className="flex items-baseline justify-between gap-3 border-b border-ocean-50 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-sm text-ocean-800">{f.label}</span>
                    <span className="font-display text-xl text-emerald-800 tabular-nums">
                      {f.price} F
                    </span>
                  </li>
                ))}
              </ul>
              {meta.paymentNote ? (
                <p className="text-xs text-ocean-500 leading-relaxed rounded-xl bg-emerald-50 px-3 py-2 border border-emerald-100">
                  {meta.paymentNote}
                </p>
              ) : null}
              <a
                href={meta.faresUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Tarifs sur le site officiel
                <ExternalLink size={14} />
              </a>
            </div>
          </aside>
        </div>

        <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 sm:p-6">
          <div className="flex gap-3">
            <AlertCircle size={22} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-amber-950">
              <p className="font-semibold">À savoir</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>{meta.notes.sunday}</li>
                <li>{meta.notes.approximate}</li>
                <li>{meta.notes.schoolTerm}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-ocean-950 flex items-center gap-2">
                <MapPin size={24} className="text-emerald-600" />
                Réseau & lignes
              </h2>
              <p className="mt-2 text-sm text-ocean-600 max-w-2xl">
                Quatre lignes relient Tiahura et la gare maritime de Vaiare par
                la côte nord ou la côte sud.
              </p>
            </div>
            <a
              href={meta.networkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Carte du réseau (site officiel)
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {LINE_IDS.map((lineId) => {
              const line = data.lines[lineId];
              const coast = meta.lineCoast?.[lineId];
              return (
                <article
                  key={lineId}
                  className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]"
                >
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                      {line.label}
                      {coast ? ` · ${coast}` : ""}
                    </p>
                    <h3 className="font-display text-xl text-ocean-950 mt-1">
                      {line.direction}
                    </h3>
                  </div>
                  <p className="text-sm text-ocean-600 mb-4 leading-relaxed">
                    {line.stops.slice(1).join(" · ")}
                  </p>
                  <div className="space-y-4">
                    <ScheduleBlock
                      lineId={lineId}
                      dayKind="week"
                      stops={line.stops}
                      rows={getLineSchedule(data, lineId, "week")}
                    />
                    <ScheduleBlock
                      lineId={lineId}
                      dayKind="sat"
                      stops={line.stops}
                      rows={getLineSchedule(data, lineId, "sat")}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {meta.travelRules ? (
          <section className="space-y-4">
            <h2 className="font-display text-2xl text-ocean-950">
              Avant votre trajet
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-ocean-100 bg-white p-5">
                <Shield size={20} className="text-emerald-600 mb-3" />
                <p className="font-semibold text-ocean-900 text-sm">Respect</p>
                <p className="mt-2 text-sm text-ocean-600 leading-relaxed">
                  {meta.travelRules.respect}
                </p>
              </div>
              <div className="rounded-2xl border border-ocean-100 bg-white p-5">
                <Ban size={20} className="text-emerald-600 mb-3" />
                <p className="font-semibold text-ocean-900 text-sm">À bord</p>
                <p className="mt-2 text-sm text-ocean-600 leading-relaxed">
                  {meta.travelRules.onboard}
                </p>
              </div>
              <div className="rounded-2xl border border-ocean-100 bg-white p-5">
                <Lightbulb size={20} className="text-emerald-600 mb-3" />
                <p className="font-semibold text-ocean-900 text-sm">Conseil</p>
                <p className="mt-2 text-sm text-ocean-600 leading-relaxed">
                  {meta.travelRules.tip}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-ocean-100 bg-ocean-50/50 p-6 text-center space-y-4">
          <p className="text-sm text-ocean-600">
            Données synchronisées depuis{" "}
            <a
              href={meta.sourceUrl}
              className="font-semibold text-emerald-700 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              mooreatransportpublic.com
            </a>
            {source.includes("cache") ? " (cache local)" : ""}.
            <br />
            Dernière mise à jour MooreaNews :{" "}
            {new Date(live.fetchedAt).toLocaleString("fr-FR", {
              timeZone: "Pacific/Tahiti",
            })}
            .
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Site officiel Transport Public Moorea
              <ExternalLink size={14} />
            </a>
            <Link
              href="/#en-direct"
              className="inline-flex items-center gap-2 rounded-full border border-ocean-200 bg-white px-5 py-2.5 text-sm font-semibold text-ocean-800 hover:bg-ocean-50"
            >
              ← Widget accueil
            </Link>
          </div>
        </section>
      </Container>
    </>
  );
}
