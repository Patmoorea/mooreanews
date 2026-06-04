"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Anchor, Ship } from "lucide-react";
import type { MooreaCruiseScheduleResult } from "@/lib/moorea-cruise-schedule";
import { formatCruiseDateTime } from "@/lib/cruise-ships";

export function CruiseShipsCard() {
  const [data, setData] = useState<MooreaCruiseScheduleResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/moorea-cruise-ships")
      .then((r) => r.json() as Promise<MooreaCruiseScheduleResult>)
      .then((d) => {
        if (!cancelled && d.visits) setData(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const now = Date.now();
  const next = (data?.visits ?? [])
    .filter((v) => Date.parse(v.visitAt) >= now - 3600000)
    .slice(0, 3);

  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5 shadow-[var(--shadow-soft)] h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Anchor size={20} className="text-ocean-700" />
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-ocean-600">
              Paquebots
            </span>
            <p className="text-sm font-display text-ocean-950 leading-tight">
              Moorea
            </p>
          </div>
        </div>
        <Link
          href="/paquebots"
          className="text-xs font-semibold text-tiare-600 hover:underline shrink-0"
        >
          Tout voir →
        </Link>
      </div>

      {next.length === 0 ? (
        <p className="mt-4 text-sm text-ocean-600">
          Chargement ou aucune escale proche…{" "}
          <Link href="/paquebots" className="text-tiare-600 hover:underline">
            Calendrier complet
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {next.map((v) => (
            <li
              key={v.id}
              className="flex items-start gap-2 text-sm border-b border-ocean-50 pb-2 last:border-0 last:pb-0"
            >
              <Ship size={14} className="text-lagon-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-ocean-950">{v.shipName}</p>
                <p className="text-xs text-ocean-600">
                  Moorea · {formatCruiseDateTime(v.visitAt)}
                  {v.timeLabel ? ` · ${v.timeLabel}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
