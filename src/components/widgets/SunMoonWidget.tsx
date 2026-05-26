"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Sunrise, Sunset } from "lucide-react";

type SunData = {
  sunrise: string;
  sunset: string;
  noon: string;
  dayLength: string;
  moonPhase: {
    phase: number;
    illumination: number;
    name: string;
    emoji: string;
  };
};

export function SunMoonWidget() {
  const t = useTranslations("widgets.sun");
  const locale = useLocale();
  const [data, setData] = useState<SunData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/sun");
        if (res.ok) setData(await res.json());
      } catch {
        /* silent */
      }
    };
    load();
  }, []);

  const formatTahitiTime = (iso: string) => {
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Pacific/Tahiti",
    }).format(new Date(iso));
  };

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-7xl opacity-10 select-none">
        🌅
      </div>
      <div className="relative">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-lagoon-700 mb-3">
          {t("title")}
        </h3>

        {!data && (
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-lagoon-100 rounded" />
            <div className="h-8 bg-lagoon-100 rounded" />
          </div>
        )}

        {data && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-sunset-50 to-transparent">
              <Sunrise className="h-6 w-6 text-sunset-500" />
              <div className="flex-1">
                <div className="text-[11px] uppercase text-muted">
                  {t("sunrise")}
                </div>
                <div className="text-lg font-semibold text-deep-900">
                  {formatTahitiTime(data.sunrise)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-hibiscus-50 to-transparent">
              <Sunset className="h-6 w-6 text-hibiscus-500" />
              <div className="flex-1">
                <div className="text-[11px] uppercase text-muted">
                  {t("sunset")}
                </div>
                <div className="text-lg font-semibold text-deep-900">
                  {formatTahitiTime(data.sunset)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-deep-50 to-transparent">
              <span className="text-2xl">{data.moonPhase.emoji}</span>
              <div className="flex-1">
                <div className="text-[11px] uppercase text-muted">
                  {t("moon")}
                </div>
                <div className="text-sm font-semibold text-deep-900">
                  {data.moonPhase.name}
                </div>
                <div className="text-[10px] text-muted">
                  {data.moonPhase.illumination}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
