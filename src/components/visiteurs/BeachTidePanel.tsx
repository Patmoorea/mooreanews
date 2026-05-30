import type { BeachTideSlot } from "@/lib/beach-tide-slots";
import Link from "next/link";

export function BeachTidePanel({ slots }: { slots: BeachTideSlot[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-ocean-950">
            Plages & créneaux snorkel
          </h2>
          <p className="text-sm text-ocean-600 mt-1">
            Score lagon + fenêtre marée indicative — mis à jour en continu.
          </p>
        </div>
        <Link
          href="/#en-direct"
          className="text-xs font-semibold text-lagon-700 hover:underline shrink-0"
        >
          Marées complètes →
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((s) => (
          <li
            key={s.beachSlug}
            className="rounded-2xl border border-ocean-100 bg-gradient-to-br from-white to-lagon-50/50 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-ocean-900">{s.beachName}</h3>
              <span className="text-sm shrink-0">
                {s.emoji} {s.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-lagon-800">{s.bestWindow}</p>
            {s.nextTide && (
              <p className="mt-1 text-xs text-ocean-500">
                Prochaine marée {s.nextTide.type} : {s.nextTide.time}
              </p>
            )}
            <p className="mt-2 text-xs text-ocean-600">{s.tip}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
