"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Siren } from "lucide-react";
import {
  AlertDistrictSubscribe,
  alertMatchesDistrictFilter,
  loadStoredDistrictFilter,
} from "@/components/alerts/AlertDistrictSubscribe";
import {
  INFOSCYCLONES_URL,
  METEO_VIGILANCE_MAP_URL,
  METEO_VIGILANCE_MOOREA_PAGE,
  meteoAlertPublicDetails,
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
  meteo: "⛅ Météo officielle",
  autre: "ℹ️ Autre",
};

function displayDetails(alert: AlertItem): string {
  if (!alert.details) return "";
  if (alert.type === "meteo") {
    return meteoAlertPublicDetails(alert.details);
  }
  return alert.details;
}

function externalHref(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return null;
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
            const body = displayDetails(a);
            const sourceHref = externalHref(a.source_url);
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
                      <p className="mt-2 text-ocean-700 whitespace-pre-wrap">{body}</p>
                    ) : null}

                    {a.type === "meteo" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={METEO_VIGILANCE_MAP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-lagon-600 px-4 py-2 text-xs font-semibold text-white hover:bg-lagon-700"
                        >
                          <ExternalLink size={12} />
                          Carte vigilance Tahiti–Moorea
                        </Link>
                        <Link
                          href={METEO_VIGILANCE_MOOREA_PAGE}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-lagon-200 bg-lagon-50 px-4 py-2 text-xs font-semibold text-lagon-800 hover:bg-lagon-100"
                        >
                          Bulletin Tahiti–Moorea
                        </Link>
                        <Link
                          href={INFOSCYCLONES_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-ocean-200 bg-white px-4 py-2 text-xs font-semibold text-ocean-800 hover:bg-ocean-50"
                        >
                          Infos cyclones
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
                      {sourceHref ? (
                        <Link
                          href={sourceHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-lagon-700 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Source officielle
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
