"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Siren, X } from "lucide-react";
import type { AlertRow } from "@/lib/supabase/types";

type ApiResponse = { ok: boolean; alerts: AlertRow[] };

function isOutageType(type: string) {
  return type === "coupure_edt" || type === "coupure_eau";
}

/** Bandeau réservé aux alertes non-coupure (météo, ferry, houle, urgent). Les coupures passent par le sticker hero. */
function pickBreakingAlert(alerts: AlertRow[]): AlertRow | null {
  const active = alerts.filter((a) => a.active && !isOutageType(a.type));
  return (
    active.find((a) => a.urgent) ??
    active.find((a) => a.type === "meteo") ??
    active.find((a) => a.type === "ferry" || a.type === "houle") ??
    null
  );
}

export function BreakingNewsSlot() {
  const [dismissed, setDismissed] = useState(false);
  const [urgent, setUrgent] = useState<AlertRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/alerts", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as ApiResponse;
        if (!cancelled) {
          setUrgent(pickBreakingAlert(json.alerts ?? []));
        }
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

  const badge = urgent.urgent
    ? "Breaking news"
    : urgent.type === "meteo"
      ? "⛅ Météo"
      : "Info importante";

  return (
    <div className="relative text-white bg-gradient-to-r from-tiare-600 via-couchant to-soleil-500">
      <div className="mx-auto max-w-7xl px-4 py-3 pr-12">
        <Link
          href="/alertes"
          className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold hover:opacity-95"
        >
          <Siren size={18} className={urgent.urgent ? "animate-pulse" : ""} />
          <span className="uppercase tracking-widest text-[11px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
          <span className="truncate max-w-[min(72ch,90vw)]">
            {urgent.type === "meteo" && urgent.details
              ? urgent.details.split("\n")[0]?.trim() || urgent.title
              : urgent.title}
          </span>
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

