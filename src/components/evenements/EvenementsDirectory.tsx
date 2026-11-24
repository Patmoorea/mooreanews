"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Tag, Clock, User, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StayDateFilter } from "@/components/visiteurs/StayDateFilter";
import { PosterImage } from "@/components/PosterImage";
import { hasPoster } from "@/lib/has-poster";
import { getEventCategoryVariant } from "@/lib/content-labels";
import type { Event } from "@/lib/content-types";

function filterEvents(events: Event[], du: string, au: string): Event[] {
  if (du && au) return events.filter((e) => e.date >= du && e.date <= au);
  if (du) return events.filter((e) => e.date >= du && e.date <= du);
  return events;
}

function EventList({
  events,
  du,
  au,
}: {
  events: Event[];
  du: string;
  au: string;
}) {
  return (
    <>
      {du && au && (
        <p className="mt-4 text-sm text-ocean-600">
          {events.length} événement(s) du {new Date(du).toLocaleDateString("fr-FR")} au{" "}
          {new Date(au).toLocaleDateString("fr-FR")}.{" "}
          <Link href="/visiteurs" className="text-lagon-700 font-semibold hover:underline">
            Guide visiteurs →
          </Link>
        </p>
      )}
      <div className="mt-8">
        {events.length === 0 ? (
          <p className="text-center text-ocean-600">
            Aucun événement à venir pour le moment.
          </p>
        ) : (
          <ul className="space-y-5">
            {events.map((e) => {
              const dateObj = new Date(e.date);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString("fr-FR", { month: "long" });
              const weekday = dateObj.toLocaleDateString("fr-FR", { weekday: "long" });
              const poster = hasPoster(e.image);
              return (
                <li key={e.slug}>
                  <Link
                    href={`/evenements/${e.slug}`}
                    className="group flex gap-4 sm:gap-6 bg-white rounded-2xl border border-ocean-100 p-5 sm:p-6 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:border-tiare-200 hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex-shrink-0 w-20 sm:w-28 bg-gradient-to-br from-tiare-400 to-tiare-600 text-white rounded-2xl flex flex-col items-center justify-center py-4">
                      <span className="text-xs uppercase tracking-widest">
                        {weekday.slice(0, 3)}
                      </span>
                      <span className="font-display text-4xl sm:text-5xl leading-none mt-1">
                        {day}
                      </span>
                      <span className="text-xs uppercase tracking-widest mt-1">{month}</span>
                    </div>
                    {poster ? (
                      <PosterImage
                        src={e.image!}
                        alt={`Affiche — ${e.title}`}
                        className="flex-shrink-0 w-24 sm:w-32 aspect-[3/4]"
                      />
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={getEventCategoryVariant(e.category)}>
                          {e.category}
                        </Badge>
                        <span className="text-xs text-ocean-600 flex items-center gap-1">
                          <Clock size={12} />
                          {weekday} {day} {month}
                          {e.time ? ` · ${e.time}` : ""}
                        </span>
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl text-ocean-900 group-hover:text-tiare-600 transition-colors">
                        {e.title}
                      </h2>
                      <p className="mt-1 text-sm text-ocean-700 line-clamp-2">{e.description}</p>
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
                    <ArrowRight
                      size={20}
                      className="self-center flex-shrink-0 text-ocean-300 group-hover:text-tiare-500 group-hover:translate-x-1 transition-all"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function Filtered({ events }: { events: Event[] }) {
  const params = useSearchParams();
  const du = params.get("du")?.trim() ?? "";
  const au = params.get("au")?.trim() ?? "";
  const shown = filterEvents(events, du, au);
  return (
    <>
      <StayDateFilter defaultStart={du} defaultEnd={au} />
      <EventList events={shown} du={du} au={au} />
    </>
  );
}

/** Le HTML statique liste tout l'agenda. `?du=&au=` filtre dans le navigateur. */
export function EvenementsDirectory({ events }: { events: Event[] }) {
  return (
    <Suspense fallback={<EventList events={events} du="" au="" />}>
      <Filtered events={events} />
    </Suspense>
  );
}
