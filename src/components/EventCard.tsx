import Image from "next/image";
import { MapPin, Clock, Tag } from "lucide-react";
import type { Event } from "@/lib/content";

export function EventCard({ event }: { event: Event }) {
  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "short" });

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all flex flex-col sm:flex-row">
      {/* Date badge */}
      <div className="sm:w-32 shrink-0 flex sm:flex-col items-center justify-center gap-1 bg-gradient-to-br from-hibiscus-500 to-sunset-500 text-white p-4 sm:p-6">
        <div className="text-3xl sm:text-4xl font-display leading-none">{day}</div>
        <div className="text-xs uppercase tracking-wider opacity-90">{month}</div>
      </div>

      {/* Image */}
      <div className="relative aspect-video sm:aspect-square sm:w-32 shrink-0">
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(min-width: 640px) 128px, 100vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-5">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-lagoon-100 text-lagoon-800 text-[10px] uppercase tracking-wider font-semibold mb-2">
          {event.category}
        </span>
        <h3 className="font-display text-xl text-deep-900 mb-1 group-hover:text-lagoon-700 transition-colors">
          {event.title}
        </h3>
        <p className="text-sm text-muted line-clamp-2 mb-3">{event.description}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {event.time}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {event.location}
          </span>
          <span className="inline-flex items-center gap-1 text-hibiscus-600 font-semibold">
            <Tag className="h-3 w-3" />
            {event.price}
          </span>
        </div>
      </div>
    </article>
  );
}
