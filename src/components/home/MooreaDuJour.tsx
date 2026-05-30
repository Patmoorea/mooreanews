import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Ship,
  Sun,
  Waves,
  UtensilsCrossed,
  Newspaper,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";

function ReadMore({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-semibold text-lagon-700 hover:text-tiare-600 transition-colors"
    >
      {label}
      <ArrowRight size={12} />
    </Link>
  );
}

export async function MooreaDuJour() {
  const data = await getMooreaDuJour();
  const fromMoorea = data.ferries.fromMoorea;
  const fromTahiti = data.ferries.fromTahiti;

  return (
    <section
      id="moorea-du-jour"
      className="py-10 sm:py-14 bg-gradient-to-br from-ocean-900 via-ocean-800 to-lagon-900 text-white scroll-mt-36 md:scroll-mt-44"
    >
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-lagon-100 text-xs font-semibold uppercase tracking-widest border border-white/10">
              <Sun size={12} />
              Moorea du jour
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl">
              L&apos;essentiel de l&apos;île, en un coup d&apos;œil
            </h2>
            <p className="mt-2 text-sm text-ocean-200 max-w-xl">
              Ferries, alertes, météo lagon et agenda — mis à jour en continu.
              Cliquez pour le détail sur le site.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-semibold border border-white/20 transition-colors"
          >
            Mode app
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Alertes */}
          <article className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5">
            <div className="flex items-center gap-2 text-tipanier-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <AlertTriangle size={14} />
              Alertes ({data.alerts.count})
            </div>
            {data.alerts.count === 0 ? (
              <p className="text-sm text-ocean-100">Aucune alerte active.</p>
            ) : (
              <ul className="space-y-2">
                {data.alerts.items.slice(0, 2).map((a) => (
                  <li key={a.id} className="text-sm leading-snug">
                    {a.urgent && (
                      <span className="text-[10px] font-bold text-soleil-300 mr-1">
                        URGENT
                      </span>
                    )}
                    {a.title}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ReadMore href="/alertes" label="Toutes les alertes" />
            </div>
          </article>

          {/* Ferries */}
          <article className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5">
            <div className="flex items-center gap-2 text-lagon-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Ship size={14} />
              Prochains ferries
            </div>
            <div className="space-y-3 text-sm">
              {fromMoorea.length > 0 && (
                <div>
                  <p className="text-ocean-300 mb-1">Moorea → Tahiti</p>
                  <ul className="space-y-1.5">
                    {fromMoorea.map((d) => (
                      <li key={`m-${d.company}`}>
                        <strong className="text-base">{d.company}</strong>{" "}
                        {d.time}
                        <span className="text-ocean-200 text-xs ml-1">
                          ({d.minutesUntil} min)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fromTahiti.length > 0 && (
                <div>
                  <p className="text-ocean-300 mb-1">Tahiti → Moorea</p>
                  <ul className="space-y-1.5">
                    {fromTahiti.map((d) => (
                      <li key={`t-${d.company}`}>
                        <strong className="text-base">{d.company}</strong>{" "}
                        {d.time}
                        <span className="text-ocean-200 text-xs ml-1">
                          ({d.minutesUntil} min)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mt-4">
              <ReadMore href="/#en-direct" label="Horaires complets" />
            </div>
          </article>

          {/* Météo & lagon */}
          <article className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5">
            <div className="flex items-center gap-2 text-soleil-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Waves size={14} />
              Lagon & météo
            </div>
            <p className="text-3xl font-display">{data.weather.temp}°C</p>
            <p className="text-sm text-ocean-200 capitalize mt-1">
              {data.weather.description} — vent {data.weather.windKmh} km/h
            </p>
            <p className="mt-3 text-sm">
              {data.swim.emoji} {data.swim.label}
            </p>
            {data.swim.nextTide && (
              <p className="text-xs text-ocean-300 mt-1">
                Marée {data.swim.nextTide.type} à {data.swim.nextTide.time}
              </p>
            )}
            <div className="mt-4">
              <ReadMore href="/#en-direct" label="Marées & prévisions" />
            </div>
          </article>

          {/* Aujourd'hui */}
          <article className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5">
            <div className="flex items-center gap-2 text-tiare-200 text-xs font-semibold uppercase tracking-wider mb-3">
              <Calendar size={14} />
              Aujourd&apos;hui
            </div>
            {data.todayEvents.length === 0 ? (
              <p className="text-sm text-ocean-200">Pas d&apos;événement majeur.</p>
            ) : (
              <ul className="space-y-2">
                {data.todayEvents.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/evenements/${e.slug}`}
                      className="text-sm hover:text-lagon-200 transition-colors"
                    >
                      {e.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <ReadMore href="/evenements" label="Agenda complet" />
            </div>
          </article>
        </div>

        {(data.openRestaurants.length > 0 || data.headlines.length > 0) && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {data.openRestaurants.length > 0 && (
              <article className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-tipanier-200 mb-3">
                  <UtensilsCrossed size={14} />
                  Ouverts maintenant
                </div>
                <ul className="flex flex-wrap gap-2">
                  {data.openRestaurants.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/restaurants/${r.slug}`}
                        className="inline-block px-3 py-1 rounded-full bg-white/10 text-sm hover:bg-white/20 transition-colors"
                      >
                        {r.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <ReadMore href="/restaurants?open=1" label="Tous les restaurants" />
                </div>
              </article>
            )}
            {data.headlines.length > 0 && (
              <article className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-lagon-200 mb-3">
                  <Newspaper size={14} />
                  À la une
                </div>
                <ul className="space-y-2">
                  {data.headlines.slice(0, 3).map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`/actualites/${a.slug}`}
                        className="text-sm hover:text-lagon-200 transition-colors line-clamp-2"
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3">
                  <ReadMore href="/actualites" label="Toutes les actus" />
                </div>
              </article>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
