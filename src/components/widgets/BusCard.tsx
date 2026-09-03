"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bus, ArrowRight, Clock, Ticket, ExternalLink } from "lucide-react";
import type { NextBusDepartures, BusDeparture } from "@/lib/buses";
import { formatBusLines, formatBusMinutesUntil } from "@/lib/buses";

export function BusCard() {
  const [data, setData] = useState<NextBusDepartures | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/buses")
        .then((r) => r.json() as Promise<NextBusDepartures>)
        .then((d) => {
          if (!cancelled) setData(d);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-tropical)] border border-ocean-100 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white">
            <Bus size={18} />
          </div>
          <div>
            <h3 className="font-display text-lg text-ocean-900 leading-none">
              Bus Moorea
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-lagon-600 mt-0.5">
              Transport public · 4 lignes
            </p>
          </div>
        </div>
        <Link
          href="/bus-moorea"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          Guide complet →
        </Link>
      </div>

      {data?.dayKind === "sun" ? (
        <p className="text-sm text-ocean-700 bg-ocean-50 rounded-2xl px-4 py-3 border border-ocean-100">
          Pas de circulation aujourd&apos;hui (dimanche). Service reprend lundi.
        </p>
      ) : !data?.serviceToday ? (
        <p className="text-sm text-ocean-700 bg-ocean-50 rounded-2xl px-4 py-3 border border-ocean-100">
          Service terminé pour aujourd&apos;hui.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <BusDirection
            label="→ Vaiare"
            sub="Lignes 1 & 2"
            icon={<ArrowRight size={16} className="text-emerald-600" />}
            departures={data?.toVaiare ?? []}
          />
          <BusDirection
            label="→ Tiahura"
            sub="Lignes 3 & 4"
            icon={<ArrowRight size={16} className="text-teal-500 rotate-180" />}
            departures={data?.toTiahura ?? []}
          />
        </div>
      )}

      {data?.fares?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {data.fares.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-100"
            >
              <Ticket size={11} aria-hidden />
              {f.price} F — {f.label}
            </span>
          ))}
        </div>
      ) : null}

      <a
        href={
          data?.officialSiteUrl ??
          data?.sourceUrl ??
          "https://mooreatransportpublic.com"
        }
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
      >
        Site officiel mooreatransportpublic.com
        <ExternalLink size={13} aria-hidden />
      </a>

      <p className="mt-3 text-[11px] text-ocean-500/80 leading-relaxed">
        {data?.operator ?? "J.RUTA Transport"} · {data?.authority ?? "Commune Moorea-Maiao"}
        {data?.source === "mooreatransportpublic.com (cache)" && (
          <>
            {" "}
            · cache local —{" "}
            <a
              href="https://mooreatransportpublic.com"
              className="underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              mooreatransportpublic.com
            </a>
          </>
        )}
      </p>
    </div>
  );
}

function BusDirection({
  label,
  sub,
  icon,
  departures,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  departures: BusDeparture[];
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-ocean-50/80 to-white p-4 border border-ocean-100/80">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div>
          <p className="text-sm font-semibold text-ocean-900">{label}</p>
          <p className="text-[10px] text-ocean-500 uppercase tracking-wide">{sub}</p>
        </div>
      </div>
      {departures.length === 0 ? (
        <p className="text-xs text-ocean-500">Aucun départ restant aujourd&apos;hui.</p>
      ) : (
        <ul className="space-y-2">
          {departures.slice(0, 3).map((d) => (
            <li
              key={`${d.direction}-${d.rawTime}-${d.lines.join("-")}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="min-w-0">
                <span className="font-bold text-ocean-900 tabular-nums">{d.time}</span>
                <span className="block text-[11px] text-ocean-600 truncate">
                  {formatBusLines(d.lines)}
                  {d.schoolTermOnly ? " · scolaire" : ""}
                </span>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <Clock size={11} aria-hidden />
                {formatBusMinutesUntil(d.minutesUntil)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
