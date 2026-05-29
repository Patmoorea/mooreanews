import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";

export async function WeekendAgenda() {
  const data = await getMooreaDuJour();
  if (data.weekendEvents.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-r from-tiare-50 to-soleil-50 border-y border-tiare-100">
      <Container>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-tiare-700">
              <CalendarDays size={14} />
              Ce week-end à Moorea
            </span>
            <h2 className="mt-2 font-display text-2xl text-ocean-950">
              Agenda du week-end
            </h2>
          </div>
          <Link
            href="/evenements"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-ocean-700 hover:text-tiare-600"
          >
            Voir tout
            <ArrowRight size={14} />
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.weekendEvents.map((e) => {
            const d = new Date(`${e.date}T12:00:00`);
            const label = d.toLocaleDateString("fr-FR", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "Pacific/Tahiti",
            });
            return (
              <li key={e.slug}>
                <Link
                  href={`/evenements/${e.slug}`}
                  className="block p-4 rounded-2xl bg-white border border-ocean-100 hover:border-tiare-200 hover:shadow-[var(--shadow-soft)] transition-all"
                >
                  <span className="text-xs font-semibold text-tiare-600 uppercase">
                    {label}
                  </span>
                  <h3 className="mt-1 font-display text-lg text-ocean-900 leading-tight">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-xs text-ocean-600">{e.location}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
