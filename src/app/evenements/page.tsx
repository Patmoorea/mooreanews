import type { Metadata } from "next";
import { MapPin, Tag, Clock, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { getUpcomingEvents } from "@/lib/content";

export const metadata: Metadata = {
  title: "Agenda des événements à Moorea",
  description:
    "Tous les événements à venir sur Moorea : concerts, marchés, fêtes traditionnelles, sport, culture.",
};

const CATEGORY_VARIANTS = {
  musique: "tiare",
  marche: "soleil",
  sport: "tipanier",
  fete: "couchant",
  culture: "ocean",
  autre: "neutral",
} as const;

export default async function EvenementsPage() {
  const events = await getUpcomingEvents();

  return (
    <>
      <PageHeader
        badge="Agenda"
        title="Événements à Moorea"
        description="Concerts, marchés, fêtes traditionnelles, sport et culture. Tout l'agenda de l'île, mis à jour en permanence."
        variant="tiare"
      />
      <Container className="py-12 sm:py-16">
        {events.length === 0 ? (
          <p className="text-center text-ocean-600">
            Aucun événement à venir pour le moment.
          </p>
        ) : (
          <ul className="space-y-5">
            {events.map((e) => {
              const dateObj = new Date(e.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString("fr-FR", {
                month: "long",
              });
              const weekday = dateObj.toLocaleDateString("fr-FR", {
                weekday: "long",
              });
              return (
                <li
                  key={e.slug}
                  className="flex gap-4 sm:gap-6 bg-white rounded-2xl border border-ocean-100 p-5 sm:p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] transition-all"
                >
                  <div className="flex-shrink-0 w-20 sm:w-28 bg-gradient-to-br from-tiare-400 to-tiare-600 text-white rounded-2xl flex flex-col items-center justify-center py-4">
                    <span className="text-xs uppercase tracking-widest">
                      {weekday.slice(0, 3)}
                    </span>
                    <span className="font-display text-4xl sm:text-5xl leading-none mt-1">
                      {day}
                    </span>
                    <span className="text-xs uppercase tracking-widest mt-1">
                      {month}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant={CATEGORY_VARIANTS[e.category]}>
                        {e.category}
                      </Badge>
                      {e.time && (
                        <span className="text-xs text-ocean-600 flex items-center gap-1">
                          <Clock size={12} />
                          {e.time}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl text-ocean-900">
                      {e.title}
                    </h2>
                    <p className="mt-1 text-sm text-ocean-700">
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
                      {e.organizer && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {e.organizer}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </>
  );
}
