import Link from "next/link";
import { ArrowRight, MapPin, Calendar, Tag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { getUpcomingEvents } from "@/lib/content";
import { formatDateShortFR } from "@/lib/utils";

const CATEGORY_VARIANTS = {
  musique: "tiare",
  marche: "soleil",
  sport: "tipanier",
  fete: "couchant",
  culture: "ocean",
  autre: "neutral",
} as const;

export function UpcomingEvents() {
  const events = getUpcomingEvents(6);

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-br from-tiare-50 via-soleil-50 to-tipanier-50">
      <Container>
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-tiare-100 text-tiare-700 text-xs font-semibold uppercase tracking-widest">
              Agenda
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ocean-950">
              Prochains événements à Moorea
            </h2>
          </div>
          <Link
            href="/evenements"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-tiare-600"
          >
            Voir l&apos;agenda complet
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const dateObj = new Date(e.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleDateString("fr-FR", {
              month: "short",
            });
            return (
              <article
                key={e.slug}
                className="group bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:-translate-y-1 transition-all"
              >
                <div className="flex">
                  <div className="w-20 sm:w-24 bg-gradient-to-br from-tiare-400 to-tiare-600 text-white flex flex-col items-center justify-center py-4">
                    <span className="font-display text-3xl leading-none">
                      {day}
                    </span>
                    <span className="text-xs uppercase tracking-widest mt-1">
                      {month}
                    </span>
                    {e.time && (
                      <span className="text-[10px] mt-2 opacity-90">
                        {e.time}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-5">
                    <Badge variant={CATEGORY_VARIANTS[e.category]}>
                      {e.category}
                    </Badge>
                    <h3 className="mt-2 font-display text-lg text-ocean-900 leading-tight group-hover:text-tiare-600 transition-colors">
                      {e.title}
                    </h3>
                    <p className="mt-2 text-sm text-ocean-600 line-clamp-2">
                      {e.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-ocean-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {e.location}
                      </span>
                      {e.price && (
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          {e.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center sm:hidden">
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-700"
          >
            Voir l&apos;agenda complet
            <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
