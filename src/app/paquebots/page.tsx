import Link from "next/link";
import { ExternalLink, Anchor, Ship } from "lucide-react";
import {
  CRUISE_MOOREA_NOTICE,
  CRUISE_SOURCE_URL,
  formatCruiseDateTime,
  formatCruisePort,
  getCruiseShipSchedule,
  type CruiseShipCall,
} from "@/lib/cruise-ships";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "Paquebots & escales en Polynésie",
  description:
    "Calendrier des paquebots et croisières : escales à Papeete et dans les îles. Données officielles Port autonome de Papeete.",
  alternates: { canonical: "/paquebots" },
};

function CallTable({
  calls,
  empty,
}: {
  calls: CruiseShipCall[];
  empty: string;
}) {
  if (calls.length === 0) {
    return (
      <p className="text-sm text-ocean-600 py-6 text-center">{empty}</p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ocean-100 text-left text-xs uppercase tracking-wider text-ocean-500">
            <th className="py-3 px-2">Date</th>
            <th className="py-3 px-2">Navire</th>
            <th className="py-3 px-2">Arrivée</th>
            <th className="py-3 px-2">Départ</th>
            <th className="py-3 px-2">Port / quai</th>
            <th className="py-3 px-2">Long.</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((c) => (
            <tr
              key={c.id}
              className="border-b border-ocean-50 hover:bg-lagon-50/50"
            >
              <td className="py-3 px-2 whitespace-nowrap font-medium text-ocean-900">
                {formatCruiseDateTime(c.movementAt)}
              </td>
              <td className="py-3 px-2 font-semibold text-ocean-950">
                {c.shipName}
              </td>
              <td className="py-3 px-2 text-ocean-700">
                {c.arrival || "—"}
              </td>
              <td className="py-3 px-2 text-ocean-700">
                {c.departure || "—"}
              </td>
              <td className="py-3 px-2 text-ocean-700">
                <span className="block font-medium">{formatCruisePort(c.port)}</span>
                <span className="text-xs text-ocean-500">
                  {[c.quay, c.berth].filter(Boolean).join(" · ") || "—"}
                </span>
              </td>
              <td className="py-3 px-2 text-ocean-600">
                {c.lengthM ? `${c.lengthM} m` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PaquebotsPage() {
  let schedule;
  let error: string | null = null;
  try {
    schedule = await getCruiseShipSchedule();
  } catch (e) {
    error = String(e);
  }

  return (
    <>
      <PageHeader
        badge="Mer & tourisme"
        title="Paquebots & escales"
        description="Prévisions officielles des paquebots en Polynésie — escales à Papeete (Tahiti) et dans les îles."
        variant="ocean"
      />
      <Container className="py-12 space-y-10">
        <div className="rounded-2xl border border-soleil-200 bg-soleil-50/90 p-5 text-sm text-ocean-900 leading-relaxed">
          <p className="flex items-start gap-2 font-semibold">
            <Anchor size={18} className="shrink-0 mt-0.5 text-soleil-700" />
            Moorea et les paquebots de croisière
          </p>
          <p className="mt-2">{CRUISE_MOOREA_NOTICE}</p>
        </div>

        {schedule && !error ? (
          <div className="flex flex-wrap gap-3">
            <StatChip
              label="Papeete"
              value={schedule.papeete.length}
              hint="escales à venir"
            />
            <StatChip
              label="Uturoa (Raiatea)"
              value={schedule.otherPorts.length}
              hint="escales à venir"
            />
            <StatChip label="Moorea" value={0} hint="pas dans les prévisions PAQUEBOT" />
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-tiare-200 bg-tiare-50 p-6 text-ocean-800">
            <p className="font-semibold">Prévisions indisponibles</p>
            <p className="text-sm mt-2">{error}</p>
            <a
              href={CRUISE_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-tiare-700 hover:underline"
            >
              Voir sur portdepapeete.pf
              <ExternalLink size={14} />
            </a>
          </div>
        ) : schedule ? (
          <>
            {schedule.updatedLabel ? (
              <p className="text-xs text-ocean-500 text-center">
                Source mise à jour : {schedule.updatedLabel}
              </p>
            ) : null}

            {schedule.otherPorts.length > 0 ? (
              <section
                id="uturoa"
                className="rounded-3xl border border-tipanier-100 bg-white p-6 shadow-[var(--shadow-soft)]"
              >
                <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
                  <Ship size={22} className="text-tipanier-600" />
                  Uturoa — Raiatea
                </h2>
                <p className="text-sm text-ocean-600 mt-1 mb-6">
                  {schedule.otherPorts.length} escale(s) paquebot (îles Sous-le-Vent,
                  hors Tahiti).
                </p>
                <CallTable
                  calls={schedule.otherPorts.slice(0, 25)}
                  empty="Aucune escale à Uturoa."
                />
                {schedule.otherPorts.length > 25 ? (
                  <p className="text-xs text-ocean-500 mt-3 text-center">
                    + {schedule.otherPorts.length - 25} autres escales — voir{" "}
                    <a
                      href={CRUISE_SOURCE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-tiare-600 hover:underline"
                    >
                      portdepapeete.pf
                    </a>
                  </p>
                ) : null}
              </section>
            ) : null}

            <section
              id="papeete"
              className="rounded-3xl border border-ocean-100 bg-white p-6 shadow-[var(--shadow-soft)]"
            >
              <div className="mb-6">
                <h2 className="font-display text-2xl text-ocean-950 flex items-center gap-2">
                  <Ship size={22} />
                  Papeete — Tahiti
                </h2>
                <p className="text-sm text-ocean-600 mt-1">
                  {schedule.papeete.length} escale(s) · point de départ habituel
                  des excursions vers Moorea
                </p>
              </div>
              <CallTable
                calls={schedule.papeete.slice(0, 25)}
                empty="Aucune escale paquebot prévue à Papeete."
              />
              {schedule.papeete.length > 25 ? (
                <p className="text-xs text-ocean-500 mt-3 text-center">
                  + {schedule.papeete.length - 25} escales Papeete sur la source
                  officielle
                </p>
              ) : null}
            </section>

            <p className="text-xs text-ocean-500 text-center">
              Données :{" "}
              <a
                href={schedule.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tiare-600 hover:underline inline-flex items-center gap-1"
              >
                {schedule.source}
                <ExternalLink size={12} />
              </a>
              · Actualisation plusieurs fois par jour sur MooreaNews
            </p>
          </>
        ) : null}

        <p className="text-center">
          <Link
            href="/#en-direct"
            className="text-lagon-700 font-semibold hover:underline"
          >
            ← Météo & ferries Moorea
          </Link>
        </p>
      </Container>
    </>
  );
}

function StatChip({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-ocean-100 bg-white px-4 py-3 min-w-[140px] shadow-sm">
      <p className="text-2xl font-display text-ocean-950">{value}</p>
      <p className="text-sm font-semibold text-ocean-800">{label}</p>
      <p className="text-xs text-ocean-500">{hint}</p>
    </div>
  );
}
