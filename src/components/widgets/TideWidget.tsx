"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Waves, TrendingUp, TrendingDown } from "lucide-react";
import { getNextTides, type Tide } from "@/lib/tides";

export function TideWidget() {
  const t = useTranslations("widgets.tides");
  const locale = useLocale();
  const [tides, setTides] = useState<Tide[]>([]);

  useEffect(() => {
    setTides(getNextTides(new Date(), 4));
    const id = setInterval(() => setTides(getNextTides(new Date(), 4)), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Pacific/Tahiti",
    }).format(date);

  const formatDay = (date: Date) => {
    const now = new Date();
    const isToday =
      date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    if (isToday) return "";
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "short",
      timeZone: "Pacific/Tahiti",
    }).format(date);
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-7xl opacity-10 select-none">
        🌊
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Waves className="h-4 w-4 text-lagoon-700" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-lagoon-700">
            {t("title")}
          </h3>
        </div>

        {tides.length === 0 ? (
          <div className="animate-pulse h-20 bg-lagoon-100 rounded" />
        ) : (
          <div className="space-y-2">
            {tides.slice(0, 4).map((tide, i) => {
              const isHigh = tide.type === "high";
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    isHigh
                      ? "bg-gradient-to-r from-lagoon-50 to-transparent"
                      : "bg-gradient-to-r from-deep-50 to-transparent"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isHigh
                        ? "bg-lagoon-100 text-lagoon-700"
                        : "bg-deep-100 text-deep-700"
                    }`}
                  >
                    {isHigh ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] uppercase text-muted font-semibold">
                      {isHigh ? t("high") : t("low")}
                    </div>
                    <div className="text-sm font-semibold text-deep-900">
                      {formatTime(tide.date)}
                      {formatDay(tide.date) && (
                        <span className="text-[10px] text-muted ml-1.5">
                          {formatDay(tide.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[9px] text-muted/70 mt-3 italic">
          Indicatif · Source SHOM pour navigation
        </p>
      </div>
    </div>
  );
}
