"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Ship, ArrowRight, ExternalLink } from "lucide-react";
import { formatMinutesUntil, type Departure, type Direction } from "@/lib/ferries";

type FerryApiResponse = {
  updatedAt: string;
  directions: { direction: Direction; departures: Departure[] }[];
};

export function FerryWidget() {
  const t = useTranslations("widgets.ferries");
  const locale = useLocale();
  const [data, setData] = useState<FerryApiResponse | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/ferries");
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        /* silent */
      }
    };
    load();
    const refresh = setInterval(load, 5 * 60 * 1000);
    const ticker = setInterval(() => setTick((n) => n + 1), 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(refresh);
      clearInterval(ticker);
    };
  }, []);

  const adjust = (mins: number) => Math.max(0, mins - tick);

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-7xl opacity-10 select-none">
        ⛴️
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Ship className="h-4 w-4 text-lagoon-700" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-lagoon-700">
            {t("title")}
          </h3>
        </div>
        <p className="text-xs text-muted mb-4">{t("subtitle")}</p>

        {!data && (
          <div className="space-y-2 animate-pulse">
            <div className="h-12 bg-lagoon-100 rounded" />
            <div className="h-12 bg-lagoon-100 rounded" />
          </div>
        )}

        {data && (
          <div className="space-y-3">
            {data.directions.map(({ direction, departures }) => {
              const next = departures[0];
              const label =
                direction === "MooreaVersTahiti" ? t("toTahiti") : t("toMoorea");
              return (
                <div
                  key={direction}
                  className="p-3 rounded-xl bg-gradient-to-r from-lagoon-50 via-deep-50 to-transparent border border-lagoon-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase font-semibold text-deep-700">
                      <span>Moorea</span>
                      <ArrowRight
                        className={`h-3 w-3 ${
                          direction === "MooreaVersTahiti" ? "" : "rotate-180"
                        }`}
                      />
                      <span>Tahiti</span>
                    </div>
                    <span className="text-[10px] text-muted">{label}</span>
                  </div>
                  {next ? (
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-display text-lagoon-800">
                          {next.time}
                        </span>
                        <span className="text-xs text-muted truncate">
                          {next.company}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-hibiscus-600 whitespace-nowrap">
                        {formatMinutesUntil(adjust(next.minutesUntil), locale)}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted">{t("noData")}</div>
                  )}
                </div>
              );
            })}
            <a
              href="https://www.horaires-tahiti.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-muted flex items-center gap-1 hover:text-lagoon-700 transition-colors"
            >
              {t("source")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
