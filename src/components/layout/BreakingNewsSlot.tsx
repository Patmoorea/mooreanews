"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Siren, X } from "lucide-react";
import type { AlertRow } from "@/lib/supabase/types";
import { outageBannerTitle } from "@/lib/outage-display";
import type { OutageDisplayRow } from "@/lib/outage-display";

type ApiResponse = { ok: boolean; alerts: AlertRow[] };

type UtilityApiResponse = {
  all?: OutageDisplayRow[];
};

function isOutageType(type: string) {
  return type === "coupure_edt" || type === "coupure_eau";
}

import { parseOutageDatesFromText } from "@/lib/outage-text-parse";

function alertToOutageRow(a: AlertRow): OutageDisplayRow | null {
  if (!isOutageType(a.type)) return null;
  const corpus = `${a.title} ${(a.details ?? "").replace(/<!--outage-sync:[^>]+-->/, "")}`;
  const dates = parseOutageDatesFromText(corpus);
  if (!dates && !a.ends_at) return null;
  return {
    kind: a.type as "coupure_edt" | "coupure_eau",
    district: a.district,
    commune: "Moorea",
    startsAt: dates?.startsAt ?? a.ends_at!,
    endsAt: dates?.endsAt ?? a.ends_at!,
    title: a.title,
  };
}

export function BreakingNewsSlot() {
  const [dismissed, setDismissed] = useState(false);
  const [urgent, setUrgent] = useState<AlertRow | null>(null);
  const [outageBanner, setOutageBanner] = useState<OutageDisplayRow | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [alertsRes, outagesRes] = await Promise.all([
          fetch("/api/alerts", { cache: "no-store" }),
          fetch("/api/utility-outages", { cache: "no-store" }),
        ]);

        let topOutage: OutageDisplayRow | null = null;
        if (outagesRes.ok) {
          const outagesJson = (await outagesRes.json()) as UtilityApiResponse;
          const { pickFeaturedOutage } = await import("@/lib/outage-display");
          topOutage = pickFeaturedOutage(outagesJson.all ?? []);
        }

        let topAlert: AlertRow | null = null;
        if (alertsRes.ok) {
          const json = (await alertsRes.json()) as ApiResponse;
          const active = (json.alerts ?? []).filter((a) => a.active);
          topAlert =
            active.find((a) => isOutageType(a.type) && a.urgent) ??
            active.find((a) => isOutageType(a.type)) ??
            active.find((a) => a.urgent) ??
            active.find((a) => a.type === "meteo") ??
            active.find((a) => a.type === "ferry" || a.type === "houle") ??
            null;
        }

        if (!cancelled) {
          setOutageBanner(topOutage);
          setUrgent(topAlert);
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

  const outageFromAlert = urgent && isOutageType(urgent.type)
    ? alertToOutageRow(urgent)
    : null;
  const featuredOutage = outageBanner ?? outageFromAlert;

  if (dismissed) return null;

  if (featuredOutage) {
    return (
      <div className="relative text-white bg-gradient-to-r from-red-700 via-orange-600 to-red-700">
        <div className="mx-auto max-w-7xl px-4 py-3 pr-12">
          <Link
            href="/coupures"
            className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold hover:opacity-95"
          >
            <Siren size={18} className="animate-pulse" />
            <span className="uppercase tracking-widest text-[11px] bg-white/20 px-2 py-0.5 rounded-full shrink-0">
              ⚡ Coupure — important
            </span>
            <span className="truncate max-w-[min(72ch,90vw)]">
              {outageBannerTitle(featuredOutage)}
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

  if (!urgent) return null;

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

