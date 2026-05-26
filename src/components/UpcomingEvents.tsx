import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { EventCard } from "./EventCard";
import type { Event } from "@/lib/content";

export function UpcomingEvents({ events }: { events: Event[] }) {
  const t = useTranslations("sections.events");
  const tCommon = useTranslations("common");

  if (events.length === 0) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-deep-900 mb-2">
              {t("title")}
            </h2>
            <p className="text-muted">{t("subtitle")}</p>
          </div>
          <Link
            href={"/evenements" as never}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-lagoon-700 hover:text-lagoon-900 transition-colors"
          >
            {tCommon("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {events.slice(0, 4).map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
