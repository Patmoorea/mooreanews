"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Ship,
  Bus,
  Waves,
  Moon,
  ThermometerSun,
} from "lucide-react";
import { MarqueeTrack } from "@/components/widgets/MarqueeTrack";
import type { WeatherSummary } from "@/lib/weather";
import type { SunMoonData } from "@/lib/sun";
import type { Departure, NextDepartures } from "@/lib/ferries";
import { formatMinutesUntil, nextDeparturesPerCompany } from "@/lib/ferries";
import type { NextBusDepartures } from "@/lib/buses";
import { formatBusLines, formatBusMinutesUntil } from "@/lib/buses";

type TickerItem = {
  icon: React.ReactNode;
  label: string;
};

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

function TickerSegment({ item }: { item: TickerItem }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 sm:px-5 text-xs sm:text-sm font-medium shrink-0">
      {item.icon}
      {item.label}
      <span className="text-lagon-400/60 ml-1" aria-hidden>
        •
      </span>
    </span>
  );
}

/**
 * Bandeau défilant : ferries, météo, marées — sans coupures ni paquebots.
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
        const [weatherRes, sunRes, ferryRes, busRes] = await Promise.all([
          fetch("/api/weather").catch(() => null),
          fetch("/api/sun").catch(() => null),
          fetch("/api/ferries").catch(() => null),
          fetch("/api/buses").catch(() => null),
        ]);

        const next: TickerItem[] = [];

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

        if (busRes?.ok) {
          const b = (await busRes.json()) as NextBusDepartures;
          if (b.dayKind === "sun") {
            next.push({
              icon: <Bus size={14} className="text-emerald-300" />,
              label: "Bus Moorea : pas de service dimanche",
            });
          } else {
            const v = b.toVaiare[0];
            const t = b.toTiahura[0];
            if (v) {
              next.push({
                icon: <Bus size={14} className="text-emerald-300" />,
                label: `Bus → Vaiare ${v.time} ${formatBusLines(v.lines)} (${formatBusMinutesUntil(v.minutesUntil)})`,
              });
            }
            if (t) {
              next.push({
                icon: <Bus size={14} className="text-emerald-300" />,
                label: `Bus → Tiahura ${t.time} ${formatBusLines(t.lines)} (${formatBusMinutesUntil(t.minutesUntil)})`,
              });
            }
          }
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

  return (
    <div
      role="region"
      aria-label="Informations en temps réel"
      className="relative z-30 overflow-hidden bg-gradient-to-r from-ocean-900 via-ocean-800 to-ocean-900 text-ocean-50 border-b border-ocean-700"
    >
      <MarqueeTrack speed={48} itemCount={items.length} trackClassName="py-2">
        {items.map((item, i) => (
          <TickerSegment key={`${item.label}-${i}`} item={item} />
        ))}
      </MarqueeTrack>
      <div className="absolute inset-y-0 left-0 w-8 sm:w-12 bg-gradient-to-r from-ocean-900 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 sm:w-12 bg-gradient-to-l from-ocean-900 to-transparent pointer-events-none" />
    </div>
  );
}
