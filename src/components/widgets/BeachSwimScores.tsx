import { getBeachSwimScores } from "@/lib/swim-beaches";
import Link from "next/link";

export async function BeachSwimScores() {
  const scores = await getBeachSwimScores();

  return (
    <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow-tropical)] border border-ocean-100 sm:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-lg text-ocean-900">Score baignade par plage</h3>
          <p className="text-xs text-ocean-500 mt-0.5">
            Vent, marée et houle — temps réel
          </p>
        </div>
        <Link href="/mon-sejour" className="text-xs text-lagon-700 font-semibold hover:underline">
          Mon séjour →
        </Link>
      </div>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {scores.map((s) => (
          <li
            key={s.beach.slug}
            className="rounded-xl bg-gradient-to-br from-ocean-50 to-lagon-50 border border-ocean-100 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ocean-900 truncate">
                {s.beach.name}
              </span>
              <span className="text-xs shrink-0" title={s.label}>
                {s.emoji} {s.label}
              </span>
            </div>
            <p className="text-[11px] text-ocean-600 mt-1 line-clamp-2">{s.advice}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
