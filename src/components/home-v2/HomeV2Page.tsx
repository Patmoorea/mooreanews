import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CloudSun,
  ExternalLink,
  Pill,
  Search,
  Ship,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { getArticles } from "@/lib/content";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { formatMorningBrief30s } from "@/lib/moorea-brief";
import { formatDateShortFR, truncate } from "@/lib/utils";
import { HomeV2BottomNav } from "@/components/home-v2/HomeV2BottomNav";

export async function HomeV2Page() {
  const [data, articles] = await Promise.all([
    getMooreaDuJour(),
    getArticles(),
  ]);
  const brief = formatMorningBrief30s(data);
  const topArticles = articles.slice(0, 5);
  const ferryOut = data.ferries.fromMoorea[0];
  const ferryIn = data.ferries.fromTahiti[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-ocean-50/40 text-ocean-950 pb-24 md:pb-8">
      {/* Header fixe */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-ocean-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/accueil-v2" className="flex items-center gap-2 min-w-0">
            <Logo size={36} className="rounded-full ring-2 ring-lagon-200 shrink-0" />
            <div className="min-w-0">
              <span className="font-display text-lg leading-tight block truncate">
                Moorea<span className="text-lagon-600">News</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-lagon-600">
                Essai v2
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/actualites"
              className="p-2 rounded-xl text-ocean-600 hover:bg-ocean-50"
              aria-label="Rechercher / actus"
            >
              <Search size={20} />
            </Link>
            <Link
              href="/alertes"
              className="relative p-2 rounded-xl text-ocean-600 hover:bg-ocean-50"
              aria-label="Alertes"
            >
              <AlertTriangle size={20} />
              {data.alerts.count > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tiare-500 ring-2 ring-white" />
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Retour classique */}
        <Link
          href="/"
          className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-ocean-200 bg-white/80 px-3 py-2 text-xs text-ocean-600 hover:border-lagon-300 hover:text-lagon-800 transition-colors"
        >
          <span>← Revenir à l&apos;accueil classique</span>
          <ExternalLink size={14} className="opacity-60" />
        </Link>

        <p className="text-center text-sm text-ocean-600 leading-snug">
          Tout ce qu&apos;il se passe à Moorea —{" "}
          <strong className="text-ocean-900">en 30 secondes</strong>
        </p>

        {/* BLOC 1 — Dashboard 5 widgets */}
        <section aria-label="Dashboard du jour" className="space-y-3">
          {/* Météo — hero widget */}
          <Link
            href="/vigilance-cyclone"
            className="block rounded-2xl bg-gradient-to-br from-lagon-500 to-ocean-700 text-white p-5 shadow-lg shadow-lagon-500/20 active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-lagon-100 flex items-center gap-1.5">
                  <Sun size={14} />
                  Météo aujourd&apos;hui
                </p>
                <p className="mt-2 font-display text-5xl leading-none">
                  {data.weather.temp}°
                </p>
                <p className="mt-1 text-sm text-lagon-100 capitalize">
                  {data.weather.description}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  {data.swim.emoji} {data.swim.label}
                </p>
                <p className="text-lagon-200 text-xs mt-1">
                  Vent {data.weather.windKmh} km/h
                </p>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            {/* Alertes */}
            <Link
              href="/alertes"
              className={`rounded-2xl border p-4 active:scale-[0.99] transition-transform ${
                data.alerts.count > 0
                  ? "bg-soleil-50 border-soleil-200"
                  : "bg-white border-ocean-100"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-ocean-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Alertes
              </p>
              {data.alerts.count === 0 ? (
                <p className="mt-2 text-sm font-medium text-lagon-700">
                  Aucune alerte
                </p>
              ) : (
                <>
                  <p className="mt-1 text-2xl font-display text-ocean-900">
                    {data.alerts.count}
                  </p>
                  <p className="text-xs text-ocean-600 line-clamp-2 mt-1">
                    {data.alerts.items[0]?.title}
                  </p>
                </>
              )}
            </Link>

            {/* Ferries */}
            <Link
              href="/trafic-ferry"
              className="rounded-2xl bg-white border border-ocean-100 p-4 active:scale-[0.99] transition-transform"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-ocean-500 flex items-center gap-1">
                <Ship size={12} />
                Ferries
              </p>
              {ferryOut && (
                <p className="mt-2 text-sm leading-snug">
                  <span className="text-ocean-500 text-xs">M→T</span>
                  <br />
                  <strong>{ferryOut.time}</strong> {ferryOut.company}
                </p>
              )}
              {ferryIn && (
                <p className="mt-1.5 text-sm leading-snug">
                  <span className="text-ocean-500 text-xs">T→M</span>
                  <br />
                  <strong>{ferryIn.time}</strong> {ferryIn.company}
                </p>
              )}
            </Link>

            {/* Résumé du jour */}
            <div className="col-span-2 rounded-2xl bg-ocean-900 text-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-lagon-300 flex items-center gap-1">
                <Sparkles size={12} />
                Moorea en 30 secondes
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ocean-100">
                {brief.body}
              </p>
            </div>

            {/* Marées */}
            <Link
              href="/#en-direct"
              className="col-span-2 rounded-2xl bg-white border border-ocean-100 p-4 flex items-center gap-3 active:scale-[0.99] transition-transform"
            >
              <Waves size={22} className="text-lagon-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ocean-500">
                  Marées & lagon
                </p>
                <p className="text-sm mt-0.5 capitalize">
                  {data.tides[0]
                    ? `Marée ${data.tides[0].type} à ${data.tides[0].time}`
                    : data.swim.advice}
                </p>
              </div>
              <ArrowRight size={16} className="text-ocean-400 shrink-0" />
            </Link>
          </div>
        </section>

        {/* BLOC 2 — Actus (max 5) */}
        <section aria-label="Actualités importantes">
          <div className="flex items-end justify-between mb-3">
            <h2 className="font-display text-xl text-ocean-900">
              Actus importantes
            </h2>
            <Link
              href="/actualites"
              className="text-xs font-semibold text-lagon-700 flex items-center gap-0.5"
            >
              Tout
              <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="space-y-3">
            {topArticles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/actualites/${a.slug}`}
                  className="flex gap-3 rounded-2xl bg-white border border-ocean-100 overflow-hidden shadow-sm hover:border-lagon-200 active:scale-[0.99] transition-all"
                >
                  <ContentCoverImage
                    src={a.image}
                    alt=""
                    category={a.category}
                    slug={a.slug}
                    className="w-24 sm:w-28 shrink-0 aspect-square object-cover"
                    sizes="112px"
                  />
                  <div className="py-3 pr-3 min-w-0 flex flex-col justify-center">
                    <Badge variant="lagon" className="w-fit text-[10px]">
                      {a.category}
                    </Badge>
                    <h3 className="mt-1 font-semibold text-sm text-ocean-900 line-clamp-2 leading-snug">
                      {a.title}
                    </h3>
                    <p className="text-[11px] text-ocean-500 mt-1">
                      {formatDateShortFR(a.publishedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* BLOC 3 — Services locaux */}
        <section aria-label="Services locaux">
          <h2 className="font-display text-xl text-ocean-900 mb-3">
            Services du jour
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/sante-garde"
              className="rounded-2xl bg-white border border-ocean-100 p-4 hover:border-lagon-200 transition-colors"
            >
              <Pill size={18} className="text-tiare-600 mb-2" />
              <p className="text-sm font-semibold">Pharmacie de garde</p>
              <p className="text-xs text-ocean-500 mt-0.5">Week-end Moorea</p>
            </Link>
            <Link
              href="/trafic-ferry"
              className="rounded-2xl bg-white border border-ocean-100 p-4 hover:border-lagon-200 transition-colors"
            >
              <Ship size={18} className="text-lagon-600 mb-2" />
              <p className="text-sm font-semibold">Horaires bateaux</p>
              <p className="text-xs text-ocean-500 mt-0.5">Live + trafic</p>
            </Link>
            <Link
              href="/vigilance-cyclone"
              className="rounded-2xl bg-white border border-ocean-100 p-4 hover:border-lagon-200 transition-colors"
            >
              <CloudSun size={18} className="text-soleil-600 mb-2" />
              <p className="text-sm font-semibold">Météo marine</p>
              <p className="text-xs text-ocean-500 mt-0.5">Vigilance PF</p>
            </Link>
            <Link
              href="/evenements"
              className="rounded-2xl bg-white border border-ocean-100 p-4 hover:border-lagon-200 transition-colors"
            >
              <Calendar size={18} className="text-ocean-600 mb-2" />
              <p className="text-sm font-semibold">Agenda</p>
              <p className="text-xs text-ocean-500 mt-0.5">
                {data.todayEvents.length > 0
                  ? truncate(data.todayEvents[0]!.title, 28)
                  : "Événements à venir"}
              </p>
            </Link>
          </div>
        </section>

        {/* Événements aujourd'hui */}
        {data.todayEvents.length > 0 && (
          <section className="rounded-2xl bg-lagon-50 border border-lagon-100 p-4">
            <h2 className="font-display text-lg text-ocean-900 mb-2">
              Aujourd&apos;hui
            </h2>
            <ul className="space-y-2">
              {data.todayEvents.slice(0, 3).map((e) => (
                <li key={e.slug}>
                  <Link
                    href={`/evenements/${e.slug}`}
                    className="text-sm font-medium text-ocean-800 hover:text-lagon-700 line-clamp-2"
                  >
                    {e.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-center text-[11px] text-ocean-400 pb-2">
          Prototype v2 — données live MooreaNews ·{" "}
          <Link href="/" className="underline hover:text-lagon-700">
            accueil classique
          </Link>
        </p>
      </main>

      <HomeV2BottomNav />
    </div>
  );
}
