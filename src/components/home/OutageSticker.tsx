"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets, Zap } from "lucide-react";

type OutageRow = {
  id: string;
  kind: "coupure_edt" | "coupure_eau";
  district: string | null;
  commune: string | null;
  startsAt: string;
  endsAt: string;
};

function tahitiDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Pacific/Tahiti",
  });
}

function relativeDay(iso: string): string {
  const today = tahitiDateKey(new Date().toISOString());
  const tomorrow = tahitiDateKey(
    new Date(Date.now() + 86400000).toISOString(),
  );
  const key = tahitiDateKey(iso);
  if (key === today) return "aujourd'hui";
  if (key === tomorrow) return "demain";
  return new Date(iso).toLocaleDateString("fr-FR", {
    timeZone: "Pacific/Tahiti",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeRange(startIso: string, endIso: string): string {
  const opts = {
    timeZone: "Pacific/Tahiti" as const,
    hour: "2-digit" as const,
    minute: "2-digit" as const,
  };
  return `${new Date(startIso).toLocaleTimeString("fr-FR", opts)}–${new Date(endIso).toLocaleTimeString("fr-FR", opts)}`;
}

function pickOutage(rows: OutageRow[]): OutageRow | null {
  const now = Date.now();
  const today = tahitiDateKey(new Date().toISOString());

  const sorted = [...rows].sort(
    (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt),
  );

  for (const o of sorted) {
    const end = Date.parse(o.endsAt);
    const startDay = tahitiDateKey(o.startsAt);
    // En cours, à venir, ou coupure du jour (même terminée)
    if (end >= now || startDay === today) return o;
  }
  return null;
}

function labelFor(o: OutageRow): string {
  const place = o.district ?? o.commune ?? "Moorea";
  const day = relativeDay(o.startsAt);
  const times = timeRange(o.startsAt, o.endsAt);
  const ended = Date.parse(o.endsAt) < Date.now();
  if (o.kind === "coupure_eau") {
    return ended
      ? `Coupure eau ${place} ${day} (terminée)`
      : `Coupure eau ${place} ${day} ${times}`;
  }
  return ended
    ? `Coupure électricité ${place} ${day} (terminée)`
    : `Coupure électricité ${place} ${day} ${times}`;
}

/** Pastille compacte sur le hero — coupures EDT/eau du jour ou à venir. */
export function OutageSticker() {
  const [outage, setOutage] = useState<OutageRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/utility-outages", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { all?: OutageRow[] };
        const next = pickOutage(data.all ?? []);
        if (!cancelled) setOutage(next);
      } catch {
        /* silencieux */
      }
    }

    load();
    const id = setInterval(load, 3 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!outage) return null;

  const isEdt = outage.kind === "coupure_edt";
  const Icon = isEdt ? Zap : Droplets;
  const inProgress =
    Date.parse(outage.startsAt) <= Date.now() &&
    Date.parse(outage.endsAt) >= Date.now();

  return (
    <Link
      href="/coupures"
      className={`inline-flex items-center gap-2 max-w-[min(100%,22rem)] px-3 py-1.5 rounded-full backdrop-blur-md border text-white text-[11px] sm:text-xs font-semibold shadow-lg transition-colors ${
        inProgress
          ? "bg-red-600/95 border-red-400/70 shadow-red-950/40 animate-pulse"
          : "bg-orange-700/90 border-orange-400/60 shadow-orange-950/30 hover:bg-orange-600"
      }`}
    >
      <Icon size={14} className="shrink-0" aria-hidden />
      <span className="truncate">{labelFor(outage)}</span>
    </Link>
  );
}
