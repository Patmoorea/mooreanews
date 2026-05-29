"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, Siren } from "lucide-react";
import {
  AlertDistrictSubscribe,
  alertMatchesDistrictFilter,
  loadStoredDistrictFilter,
} from "@/components/alerts/AlertDistrictSubscribe";

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
          {visible.map((a) => (
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
                  {a.details ? (
                    <p className="mt-2 text-ocean-700 whitespace-pre-wrap">{a.details}</p>
                  ) : null}
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
    </>
  );
}
