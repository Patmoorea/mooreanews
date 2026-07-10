import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  Phone,
  Tag,
  User,
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShareButtons } from "@/components/ShareButtons";
import { getEventBySlug, getEvents, getUpcomingEvents } from "@/lib/content";
import { getEventCategoryVariant } from "@/lib/content-labels";
import { formatDateFR } from "@/lib/utils";
import { SITE } from "@/lib/constants";
import { buildEventJsonLd } from "@/lib/event-jsonld";
import { buildPageShareMetadata } from "@/lib/seo";
import { PosterImage } from "@/components/PosterImage";
import { hasPoster } from "@/lib/has-poster";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const events = await getEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Événement introuvable" };
  const ogImage = hasPoster(event.image) ? event.image!.trim() : undefined;
  return buildPageShareMetadata({
    title: event.title,
    description: event.description,
    path: `/evenements/${event.slug}`,
    imageUrl: ogImage,
    type: "article",
  });
}

/**
 * Construit une URL Google Calendar pour ajouter l'événement directement.
 */
function buildGoogleCalendarUrl(event: {
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  description: string;
  location: string;
}) {
  const start = toGCalDate(event.date, event.time, false);
  const end = toGCalDate(
    event.endDate ?? event.date,
    event.time,
    true,
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function toGCalDate(date: string, time: string | undefined, isEnd: boolean) {
  const d = date.replaceAll("-", "");
  if (!time) {
    return d;
  }
  const t = time.replace(":", "") + "00";
  const padded = t.padEnd(6, "0").slice(0, 6);
  if (isEnd) {
    const [hh, mm, ss] = [
      parseInt(padded.slice(0, 2), 10) + 2,
      parseInt(padded.slice(2, 4), 10),
      parseInt(padded.slice(4, 6), 10),
    ];
    const endTime = `${String(Math.min(23, hh)).padStart(2, "0")}${String(mm).padStart(2, "0")}${String(ss).padStart(2, "0")}`;
    return `${d}T${endTime}`;
  }
  return `${d}T${padded}`;
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const upcoming = await getUpcomingEvents();
  const related = upcoming
    .filter((e) => e.slug !== event.slug && e.category === event.category)
    .slice(0, 3);

  const shareUrl = `${SITE.url}/evenements/${event.slug}`;
  const gcalUrl = buildGoogleCalendarUrl(event);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.location}, Moorea, Polynésie française`,
  )}`;

  const dateObj = new Date(event.date);

  return (
    <article>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-tiare-100 via-soleil-50 to-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-tapa opacity-30 pointer-events-none"
        />
        <Container className="relative py-12 sm:py-16">
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-6"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;agenda
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant={getEventCategoryVariant(event.category)}>
              {event.category}
            </Badge>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-balance leading-[1.1] text-ocean-950">
            {event.title}
          </h1>

          <div className="mt-6 grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-8 items-start max-w-3xl">
            <div className="bg-gradient-to-br from-tiare-400 to-tiare-600 text-white rounded-2xl px-6 py-4 text-center shadow-[var(--shadow-tropical)]">
              <div className="text-xs uppercase tracking-widest">
                {dateObj.toLocaleDateString("fr-FR", { weekday: "long" })}
              </div>
              <div className="font-display text-5xl leading-none mt-1">
                {dateObj.getDate()}
              </div>
              <div className="text-xs uppercase tracking-widest mt-1">
                {dateObj.toLocaleDateString("fr-FR", { month: "long" })}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-ocean-700">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-tiare-500" />
                <span className="font-medium">
                  {formatDateFR(event.date)}
                  {event.endDate && event.endDate !== event.date && (
                    <> → {formatDateFR(event.endDate)}</>
                  )}
                </span>
              </div>
              {event.time && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-tiare-500" />
                  {event.time}
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-tiare-500" />
                {event.location}
                {event.district && (
                  <span className="text-ocean-500">· {event.district}</span>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Corps */}
      <Container size="narrow" className="py-10 sm:py-14">
        {hasPoster(event.image) ? (
          <PosterImage
            src={event.image!}
            alt={`Affiche — ${event.title}`}
            className="mb-10 w-full max-w-xl mx-auto aspect-[3/4] min-h-[280px]"
          />
        ) : null}

        <div className="prose-tropical">
          {event.description.split("\n\n").map((para, i) => (
            <p key={i} className="text-lg leading-relaxed text-ocean-900 mb-6">
              {para}
            </p>
          ))}
        </div>

        {/* Infos pratiques */}
        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {event.organizer && (
            <InfoTile icon={<User size={16} />} label="Organisateur">
              {event.organizer}
            </InfoTile>
          )}
          {event.price && (
            <InfoTile icon={<Tag size={16} />} label="Tarif">
              {event.price}
            </InfoTile>
          )}
          {event.contact && (
            <InfoTile icon={<Phone size={16} />} label="Contact">
              {event.contact}
            </InfoTile>
          )}
          {event.url && (
            <InfoTile icon={<ExternalLink size={16} />} label="Site officiel">
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-tiare-600 hover:underline break-all"
              >
                {event.url}
              </a>
            </InfoTile>
          )}
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform"
          >
            <CalendarPlus size={18} />
            Ajouter à mon agenda
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-ocean-800 font-semibold border-2 border-ocean-200 hover:border-tiare-400 transition-colors"
          >
            <MapPin size={18} />
            Voir sur la carte
          </a>
        </div>

        {/* Partage */}
        <div className="mt-10 pt-8 border-t border-ocean-100">
          <ShareButtons
            url={shareUrl}
            title={event.title}
            description={event.description.slice(0, 140)}
          />
        </div>
      </Container>

      {/* Événements liés */}
      {related.length > 0 && (
        <section className="py-14 bg-gradient-to-b from-ocean-50 to-white">
          <Container>
            <h2 className="font-display text-2xl sm:text-3xl text-ocean-950 mb-8">
              D&apos;autres événements à venir
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((e) => (
                <Link
                  key={e.slug}
                  href={`/evenements/${e.slug}`}
                  className="group bg-white rounded-2xl border border-ocean-100 p-5 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-all"
                >
                  <Badge variant={getEventCategoryVariant(e.category)}>
                    {e.category}
                  </Badge>
                  <h3 className="mt-2 font-display text-lg text-ocean-900 group-hover:text-tiare-600 transition-colors">
                    {e.title}
                  </h3>
                  <p className="mt-1 text-sm text-ocean-600 line-clamp-2">
                    {e.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ocean-500">
                    <Calendar size={12} />
                    {formatDateFR(e.date)}
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* JSON-LD Event */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildEventJsonLd(event, shareUrl)),
        }}
      />
    </article>
  );
}

function InfoTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-lagon-50 border border-lagon-100">
      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-white text-tiare-500 flex items-center justify-center shadow-sm">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-ocean-500 font-medium">
          {label}
        </div>
        <div className="text-sm text-ocean-900 mt-0.5">{children}</div>
      </div>
    </div>
  );
}
