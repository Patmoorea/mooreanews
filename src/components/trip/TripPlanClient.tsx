"use client";

import { Share2 } from "lucide-react";
import type { TripPlan } from "@/lib/mon-sejour";

export function TripPlanClient({ plan }: { plan: TripPlan }) {
  async function shareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(plan.shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-8">
      {plan.days.map((day) => (
        <section key={day.dayLabel}>
          <h2 className="font-display text-lg text-ocean-950 mb-3">{day.dayLabel}</h2>
          <ol className="space-y-3">
            {day.items.map((item, i) => (
              <li
                key={`${day.dayLabel}-${i}`}
                className="bg-white rounded-2xl border border-ocean-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {item.time && (
                      <span className="text-xs font-semibold text-lagon-700 uppercase">
                        {item.time}
                      </span>
                    )}
                    <p className="font-semibold text-ocean-900">{item.title}</p>
                    <p className="text-sm text-ocean-600 mt-1">{item.detail}</p>
                  </div>
                  {item.href && (
                    <a
                      href={item.href}
                      className="text-xs font-semibold text-lagon-700 shrink-0 hover:underline"
                    >
                      Voir →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <button
        type="button"
        onClick={shareWhatsApp}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        <Share2 size={16} />
        Partager sur WhatsApp
      </button>
    </div>
  );
}
