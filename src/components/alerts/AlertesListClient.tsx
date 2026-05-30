"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Siren } from "lucide-react";
import {
  AlertDistrictSubscribe,
  alertMatchesDistrictFilter,
  loadStoredDistrictFilter,
} from "@/components/alerts/AlertDistrictSubscribe";
import {
  INFOS_CYCLONES_URL,
  METEO_VIGILANCE_MOOREA_PAGE,
  isMeteoVigilanceSourceUrl,
  resolveMeteoVigilancePublicUrl,
  sanitizeAlertDetailsForDisplay,
} from "@/lib/meteo-vigilance";

type AlertItem = {
  id: string;
  type: string;
  title: string;
  details: string | null;
  district: string | null;
  source_url: string | null;
  urgent: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  coupure_eau: "🚰 Coupure d'eau",
  coupure_edt: "⚡ Coupure EDT",
  route: "🚧 Route / travaux",
  houle: "🌊 Houle",
  ferry: "⛴ Ferry",
  meteo: "⛅ Météo",
  autre: "ℹ️ Autre",
};

function linkifyLine(line: string): ReactNode {
  const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
  if (!urlMatch) return line;
  const [before, after] = [
    line.slice(0, urlMatch.index),
    line.slice((urlMatch.index ?? 0) + urlMatch[0].length),
  ];
  return (
    <>
      {before}
      <a
        href={urlMatch[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-lagon-700 font-semibold hover:underline break-all"
      >
        {urlMatch[0]}
      </a>
      {after}
    </>
  );
}

export function AlertesListClient({ alerts }: { alerts: AlertItem[] }) {
  const [filter, setFilter] = useState<string[]>([]);

  useEffect(() => {
    setFilter(loadStoredDistrictFilter());
  }, []);

  const visible = alerts.filter((a) =>
    alertMatchesDistrictFilter(a.district, filter),
  );

  return (
    <>
      <AlertDistrictSubscribe onDistrictsChange={setFilter} />

      {filter.length > 0 && (
        <p className="text-sm text-ocean-600 mb-6 -mt-4">
          Filtre actif : {filter.join(", ")} + alertes île entière (
          {visible.length} affichée{visible.length > 1 ? "s" : ""})
        </p>
      )}

      {visible.length === 0 ? (
        <div className="bg-white rounded-3xl border border-ocean-100 p-10 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-ocean-700 font-medium">
            {alerts.length === 0
              ? "Aucune alerte active pour le moment."
              : "Aucune alerte pour vos quartiers sélectionnés."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visible.map((a) => {
            const isMeteoVigilance =
              a.type === "meteo" && isMeteoVigilanceSourceUrl(a.source_url);
            const publicUrl = resolveMeteoVigilancePublicUrl(a.source_url);
            const body = sanitizeAlertDetailsForDisplay(a.details);

            return (
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
                    <h2 className="font-display text-2xl text-ocean-950">{a.title}</h2>
                    {body ? (
                      <div className="mt-3 text-ocean-700 whitespace-pre-wrap space-y-1">
                        {body.split("\n").map((line, i) => (
                          <p key={i}>{linkifyLine(line)}</p>
                        ))}
                      </div>
                    ) : null}

                    {isMeteoVigilance && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        <a
                          href={METEO_VIGILANCE_MOOREA_PAGE}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lagon-600 text-white text-sm font-semibold hover:bg-lagon-700"
                        >
                          <ExternalLink size={14} />
                          Bulletin meteo.pf
                        </a>
                        <a
                          href={INFOS_CYCLONES_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ocean-100 text-ocean-900 text-sm font-semibold hover:bg-ocean-200"
                        >
                          <ExternalLink size={14} />
                          Infos cyclones
                        </a>
                        <Link
                          href="/vigilance-cyclone"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ocean-200 text-ocean-800 text-sm font-semibold hover:border-lagon-300"
                        >
                          Mode cyclone MooreaNews
                        </Link>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-ocean-600">
                      {a.district ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} />
                          {a.district}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-lagon-700">
                          <MapPin size={12} />
                          Toute l&apos;île
                        </span>
                      )}
                      {a.source_url && !isMeteoVigilance ? (
                        <Link
                          href={publicUrl}
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
            );
          })}
        </div>
      )}
    </>
  );
}
