"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Ship,
  Waves,
  Moon,
  ThermometerSun,
  Zap,
  Droplets,
  Anchor,
} from "lucide-react";
import Link from "next/link";
import type { HomeHighlight } from "@/lib/home-highlights";
import type { WeatherSummary } from "@/lib/weather";
import type { SunMoonData } from "@/lib/sun";
import type { Departure, NextDepartures } from "@/lib/ferries";
import { formatMinutesUntil, nextDeparturesPerCompany } from "@/lib/ferries";

type TickerItem = {
  icon: React.ReactNode;
  label: string;
  href?: string;
  highlight?: boolean;
};

function highlightIcon(kind: HomeHighlight["kind"]) {
  switch (kind) {
    case "coupure_edt":
      return <Zap size={14} className="text-soleil-300" />;
    case "coupure_eau":
      return <Droplets size={14} className="text-lagon-300" />;
    case "paquebot":
      return <Anchor size={14} className="text-tipanier-300" />;
  }
}

function highlightTickerItems(items: HomeHighlight[]): TickerItem[] {
  return items.map((h) => ({
    icon: highlightIcon(h.kind),
    label: h.label,
    href: h.href,
    highlight: true,
  }));
}

function shortCompany(name: string): string {
  if (/aremiti/i.test(name)) return "Aremiti";
  if (/tauati|tuatea|apetahi/i.test(name)) return "Tauati";
  if (/vaeara/i.test(name)) return "Vaeara'i";
  return name.split(/\s+/)[0] ?? name;
}

function ferryTickerItems(
  label: string,
  departures: Departure[],
): TickerItem[] {
  return nextDeparturesPerCompany(departures).map((d) => ({
    icon: <Ship size={14} className="text-lagon-300" />,
    label: `${label} : ${d.time} ${shortCompany(d.company)} (${formatMinutesUntil(d.minutesUntil)})`,
  }));
}

/**
 * Bandeau défilant : ferries en premier, défilement rapide (~18 s / cycle).
 */
export function Ticker() {
  const [items, setItems] = useState<TickerItem[]>([
    {
      icon: <Sun size={14} className="text-soleil-300" />,
      label: "Ia ora na — bienvenue sur Moorea",
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [weatherRes, sunRes, ferryRes, highlightsRes] = await Promise.all([
          fetch("/api/weather", { cache: "no-store" }).catch(() => null),
          fetch("/api/sun", { cache: "no-store" }).catch(() => null),
          fetch("/api/ferries", { cache: "no-store" }).catch(() => null),
          fetch("/api/home-highlights", { cache: "no-store" }).catch(() => null),
        ]);

        const next: TickerItem[] = [];

        if (highlightsRes?.ok) {
          const { highlights } = (await highlightsRes.json()) as {
            highlights: HomeHighlight[];
          };
          if (highlights?.length) {
            next.push(...highlightTickerItems(highlights));
          }
        }

        next.push({
          icon: <Sun size={14} className="text-soleil-300" />,
          label: "Ia ora na — bienvenue sur Moorea",
        });

        if (ferryRes?.ok) {
          const f = (await ferryRes.json()) as NextDepartures;
          next.push(
            ...ferryTickerItems("Moorea → Tahiti", f.fromMoorea ?? []),
            ...ferryTickerItems("Tahiti → Moorea", f.fromTahiti ?? []),
          );
        }

        if (weatherRes?.ok) {
          const w: WeatherSummary = await weatherRes.json();
          next.push({
            icon: <ThermometerSun size={14} className="text-soleil-300" />,
            label: `Moorea ${Math.round(w.temp)}°C · ${w.description}`,
          });
        }

        if (sunRes?.ok) {
          const s: SunMoonData = await sunRes.json();
          next.push({
            icon: <Sun size={14} className="text-soleil-300" />,
            label: `Lever ${s.sunrise} · Coucher ${s.sunset}`,
          });
          next.push({
            icon: <Moon size={14} className="text-ocean-200" />,
            label: `Lune ${s.moonPhase}`,
          });
        }

        next.push({
          icon: <Waves size={14} className="text-lagon-300" />,
          label: "Conditions de lagon : consulter avant baignade",
        });

        if (!cancelled) setItems(next);
      } catch {
        // silencieux : on garde le contenu par défaut
      }
    }

    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <div
      role="region"
      aria-label="Informations en temps réel"
      className="relative z-30 overflow-hidden bg-gradient-to-r from-ocean-900 via-ocean-800 to-ocean-900 text-ocean-50 border-b border-ocean-700"
    >
      <div className="flex animate-marquee whitespace-nowrap py-2 will-change-transform">
        {doubled.map((item, i) => {
          const inner = (
            <>
              {item.icon}
              {item.label}
            </>
          );
          return (
            <span
              key={i}
              className={`inline-flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-medium shrink-0 ${
                item.highlight ? "text-soleil-100" : ""
              }`}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-2 hover:text-white hover:underline underline-offset-2"
                >
                  {inner}
                </Link>
              ) : (
                inner
              )}
              <span className="text-lagon-400/60 ml-1" aria-hidden>
                •
              </span>
            </span>
          );
        })}
      </div>
      <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-ocean-900 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-ocean-900 to-transparent pointer-events-none" />
    </div>
  );
}
