import { setRequestLocale, getTranslations } from "next-intl/server";
import { EventCard } from "@/components/EventCard";
import { getEvents } from "@/lib/content";
import { Calendar } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("events") };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "sections.events" });
  const events = getEvents();

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-hibiscus-500 via-sunset-500 to-hibiscus-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Calendar className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            {t("title")}
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {events.length === 0 ? (
          <div className="text-center text-muted py-16">
            Aucun événement à venir pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {events.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
