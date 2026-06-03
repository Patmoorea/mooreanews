"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Siren, X } from "lucide-react";
import type { AlertRow } from "@/lib/supabase/types";

type ApiResponse = { ok: boolean; alerts: AlertRow[] };

function isOutageType(type: string) {
  return type === "coupure_edt" || type === "coupure_eau";
}

export function BreakingNewsSlot() {
  const [dismissed, setDismissed] = useState(false);
  const [urgent, setUrgent] = useState<AlertRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as ApiResponse;
        const active = (json.alerts ?? []).filter((a) => a.active);
        const top =
          active.find((a) => a.urgent && !isOutageType(a.type)) ??
          active.find((a) => a.type === "meteo") ??
          active.find((a) => a.type === "ferry" || a.type === "houle") ??
          null;
        if (!cancelled) setUrgent(top);
      } catch {
        // ignore
      }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (dismissed || !urgent) return null;

  const isOutage = isOutageType(urgent.type);
  const badge = isOutage
    ? "⚡ Coupure — important"
    : urgent.urgent
      ? "Breaking news"
      : "Info importante";

  return (
    <div
      className={`relative text-white ${
        isOutage
          ? "bg-gradient-to-r from-red-700 via-orange-600 to-red-700"
          : "bg-gradient-to-r from-tiare-600 via-couchant to-soleil-500"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-3 pr-12">
        <Link
          href={isOutage ? "/coupures" : "/alertes"}
          className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold hover:opacity-95"
        >
          <Siren size={18} className={isOutage ? "animate-pulse" : ""} />
          <span className="uppercase tracking-widest text-[11px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
          <span className="truncate max-w-[72ch]">{urgent.title}</span>
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10"
        aria-label="Fermer le bandeau"
      >
        <X size={16} />
      </button>
    </div>
  );
}

