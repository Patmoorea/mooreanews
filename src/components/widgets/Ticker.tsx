"use client";

import { useEffect, useState } from "react";
import {
  Cloud,
  Sun,
  Ship,
  Waves,
  Moon,
  ThermometerSun,
} from "lucide-react";
import type { WeatherSummary } from "@/lib/weather";
import type { SunMoonData } from "@/lib/sun";

type TickerItem = {
  icon: React.ReactNode;
  label: string;
};

/**
 * Bandeau défilant en haut de site avec les infos live :
 * météo, soleil/lune, prochain ferry, marées, salutation.
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
        const [weatherRes, sunRes, ferryRes] = await Promise.all([
          fetch("/api/weather", { cache: "no-store" }).catch(() => null),
          fetch("/api/sun", { cache: "no-store" }).catch(() => null),
          fetch("/api/ferries", { cache: "no-store" }).catch(() => null),
        ]);

        const next: TickerItem[] = [
          {
            icon: <Sun size={14} className="text-soleil-300" />,
            label: "Ia ora na — bienvenue sur Moorea",
          },
        ];

        if (ferryRes?.ok) {
          const f = await ferryRes.json();
          const moorea = f?.fromMoorea?.[0];
          const tahiti = f?.fromTahiti?.[0];
          if (moorea) {
            next.push({
              icon: <Ship size={14} className="text-lagon-300" />,
              label: `⛴ Prochain ferry Moorea → Tahiti à ${moorea.time}`,
            });
          }
          if (tahiti) {
            next.push({
              icon: <Ship size={14} className="text-lagon-300" />,
              label: `⛴ Prochain ferry Tahiti → Moorea à ${tahiti.time}`,
            });
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
        next.push({
          icon: <Cloud size={14} className="text-ocean-200" />,
          label: "Mises à jour automatiques toutes les heures",
        });

        if (!cancelled) setItems(next);
      } catch {
        // silencieux : on garde le contenu par défaut
      }
    }

    load();
    const id = setInterval(load, 5 * 60 * 1000); // refresh 5 min
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const doubled = [...items, ...items];

  return (
    <div
      role="region"
      aria-label="Bandeau défilant — météo, horaires ferries et infos live"
      className="relative overflow-hidden bg-gradient-to-r from-ocean-900 via-ocean-800 to-ocean-900 text-ocean-50 border-b border-ocean-700"
    >
      <div className="flex animate-marquee whitespace-nowrap py-2">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-6 text-xs sm:text-sm font-medium"
          >
            {item.icon}
            {item.label}
            <span className="text-lagon-400/60 ml-2">•</span>
          </span>
        ))}
      </div>
      {/* Dégradés sur les bords */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-ocean-900 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-ocean-900 to-transparent pointer-events-none" />
    </div>
  );
}
