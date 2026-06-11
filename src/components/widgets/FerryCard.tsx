"use client";

import { useEffect, useState } from "react";
import { Ship, ArrowRight, Clock, Ticket } from "lucide-react";
import type { NextDepartures } from "@/lib/ferries";
import { formatMinutesUntil } from "@/lib/ferries";
import {
  ferryStatusClass,
  ferryStatusLabel,
  type FerryLiveStatus,
} from "@/lib/ferry-live-status";
import { ferryBookingUrl } from "@/lib/constants";

export function FerryCard() {
  const [data, setData] = useState<NextDepartures | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/ferries")
        .then((r) => r.json() as Promise<NextDepartures>)
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-tropical)] border border-ocean-100">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white">
            <Ship size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg text-ocean-900 leading-none">
              Ferries en direct
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-lagon-600 mt-0.5">
              Tahiti ↔ Moorea
            </p>
          </div>
        </div>
        <a
          href="https://www.horaires-tahiti.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ocean-600 hover:text-ocean-800"
        >
          Tous les horaires →
        </a>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FerryDirection
          label="Moorea → Tahiti"
          icon={<ArrowRight size={16} className="text-lagon-600" />}
          departures={data?.fromMoorea ?? []}
        />
        <FerryDirection
          label="Tahiti → Moorea"
          icon={<ArrowRight size={16} className="text-tiare-500" />}
          departures={data?.fromTahiti ?? []}
        />
      </div>

      {data?.source === "compagnies-direct" && (
        <p className="mt-4 text-[11px] text-ocean-500/80 leading-relaxed">
          Aremiti &amp; Vaeara&apos;i : horaires en direct (sites officiels). Tauati
          : horaires-tahiti.com.
        </p>
      )}
      {data?.source === "horaires-tahiti.com (cache)" && (
        <p className="mt-4 text-[11px] text-ocean-500/80 leading-relaxed">
          Horaires depuis cache local. Source :{" "}
          <a
            href="https://www.horaires-tahiti.com"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            horaires-tahiti.com
          </a>
        </p>
      )}
      {data?.source === "unavailable" && (
        <p className="mt-4 text-[11px] text-tiare-700 leading-relaxed">
          Horaires indisponibles. Consultez{" "}
          <a
            href="https://www.horaires-tahiti.com"
            className="underline font-medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            horaires-tahiti.com
          </a>
          .
        </p>
      )}
    </div>
  );
}

function FerryDirection({
  label,
  icon,
  departures,
}: {
  label: string;
  icon: React.ReactNode;
  departures: {
    time: string;
    minutesUntil: number;
    company: string;
    liveStatus?: FerryLiveStatus | null;
  }[];
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-ocean-50 to-lagon-50 p-4 border border-ocean-100">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ocean-700 mb-3">
        {icon}
        <span>{label}</span>
      </div>
      {departures.length === 0 && (
        <p className="text-sm text-ocean-500">Aucun départ aujourd&apos;hui</p>
      )}
      <ul className="space-y-2">
        {departures.slice(0, 5).map((d, i) => (
          <li
            key={`${d.time}-${d.company}-${i}`}
            className="flex items-center justify-between text-sm bg-white/70 rounded-lg px-3 py-2 gap-2"
          >
            <div className="min-w-0">
              <span className="font-bold text-ocean-900">{d.time}</span>
              {d.liveStatus && d.liveStatus !== "on_time" && (
                <span
                  className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${ferryStatusClass(d.liveStatus)}`}
                >
                  {ferryStatusLabel(d.liveStatus)}
                </span>
              )}
              <span className="block text-[10px] text-ocean-500 truncate">
                {d.company}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-ocean-600 flex items-center gap-1">
                <Clock size={12} />
                {formatMinutesUntil(d.minutesUntil)}
              </span>
              <a
                href={ferryBookingUrl(d.company)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-md text-ocean-600 hover:bg-ocean-100"
                aria-label={`Réserver ${d.company}`}
                title="Billetterie"
              >
                <Ticket size={14} />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
