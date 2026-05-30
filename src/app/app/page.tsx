import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Ship,
  Sun,
  Waves,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "App MooreaNews",
  description:
    "Résumé quotidien Moorea — ferries, alertes, météo. Cliquez pour le détail sur mooreanews.com.",
  robots: { index: false, follow: false },
};

export default async function AppPage() {
  const data = await getMooreaDuJour();
  const base = SITE.url.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-900 to-ocean-950 text-white">
      <header className="sticky top-0 z-10 bg-ocean-900/95 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={36} className="rounded-full ring-2 ring-lagon-400/50" />
          <span className="font-display text-lg">
            Moorea<span className="text-lagon-300">News</span>
          </span>
        </Link>
        <a
          href={base}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-lagon-600 hover:bg-lagon-500 transition-colors"
        >
          Site complet
          <ExternalLink size={12} />
        </a>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-8">
        <p className="text-sm text-ocean-300 text-center">
          Résumé rapide — touchez une carte pour l&apos;info complète sur le site.
        </p>

        {/* Ferries */}
        <AppCard
          href={`${base}/#en-direct`}
          icon={<Ship size={20} className="text-lagon-300" />}
          title="Prochains ferries"
        >
          {data.ferries.fromMoorea[0] && (
            <p className="text-sm">
              M→T : <strong>{data.ferries.fromMoorea[0].company}</strong>{" "}
              {data.ferries.fromMoorea[0].time}
            </p>
          )}
          {data.ferries.fromTahiti[0] && (
            <p className="text-sm mt-1">
              T→M : <strong>{data.ferries.fromTahiti[0].company}</strong>{" "}
              {data.ferries.fromTahiti[0].time}
            </p>
          )}
        </AppCard>

        {/* Météo */}
        <AppCard
          href={`${base}/#en-direct`}
          icon={<Sun size={20} className="text-soleil-300" />}
          title={`${data.weather.temp}°C — ${data.weather.description}`}
        >
          <p className="text-sm">
            {data.swim.emoji} {data.swim.label}
          </p>
          <p className="text-xs text-ocean-300 mt-1">{data.swim.advice}</p>
        </AppCard>

        {/* Marées */}
        <AppCard
          href={`${base}/#en-direct`}
          icon={<Waves size={20} className="text-tipanier-300" />}
          title="Marées & baignade"
        >
          {data.tides.map((t, i) => (
            <p key={i} className="text-sm capitalize">
              Marée {t.type} à {t.time}
            </p>
          ))}
        </AppCard>

        {/* Alertes */}
        <AppCard
          href={`${base}/alertes`}
          icon={<AlertTriangle size={20} className="text-soleil-300" />}
          title={`Alertes (${data.alerts.count})`}
        >
          {data.alerts.count === 0 ? (
            <p className="text-sm text-ocean-300">Aucune alerte active.</p>
          ) : (
            data.alerts.items.slice(0, 3).map((a) => (
              <p key={a.id} className="text-sm">
                {a.urgent ? "⚡ " : ""}
                {a.title}
              </p>
            ))
          )}
        </AppCard>

        {/* Events */}
        {data.todayEvents.length > 0 && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h2 className="font-display text-lg mb-3">Aujourd&apos;hui</h2>
            <ul className="space-y-2">
              {data.todayEvents.map((e) => (
                <li key={e.slug}>
                  <a
                    href={`${base}/evenements/${e.slug}`}
                    className="flex items-center justify-between gap-2 text-sm hover:text-lagon-200 py-2 border-b border-white/5 last:border-0"
                  >
                    <span>{e.title}</span>
                    <ArrowRight size={14} className="flex-shrink-0 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={`${base}/evenements`}
              className="inline-block mt-3 text-xs font-semibold text-lagon-300"
            >
              Agenda complet →
            </a>
          </section>
        )}

        {/* Headlines */}
        {data.headlines.length > 0 && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h2 className="font-display text-lg mb-3">À la une</h2>
            <ul className="space-y-2">
              {data.headlines.map((a) => (
                <li key={a.slug}>
                  <a
                    href={`${base}/actualites/${a.slug}`}
                    className="flex items-center justify-between gap-2 text-sm hover:text-lagon-200 py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="line-clamp-2">{a.title}</span>
                    <ArrowRight size={14} className="flex-shrink-0 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
            <a
              href={`${base}/actualites`}
              className="inline-block mt-3 text-xs font-semibold text-lagon-300"
            >
              Toutes les actus →
            </a>
          </section>
        )}

        {/* Open restaurants */}
        {data.featuredRestaurants.length > 0 && (
          <section className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <h2 className="font-display text-lg mb-3">Où manger</h2>
            <div className="flex flex-wrap gap-2">
              {data.featuredRestaurants.map((r) => (
                <a
                  key={r.slug}
                  href={`${base}/restaurants/${r.slug}`}
                  className="px-3 py-1.5 rounded-full bg-white/10 text-sm hover:bg-white/20"
                >
                  {r.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <a
          href={base}
          className="block w-full text-center py-4 rounded-2xl bg-gradient-to-r from-lagon-500 to-ocean-600 font-semibold text-white shadow-lg"
        >
          Ouvrir le site complet MooreaNews
        </a>
      </main>
    </div>
  );
}

function AppCard({
  href,
  icon,
  title,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="block rounded-2xl bg-white/10 border border-white/10 p-4 hover:bg-white/15 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base">{title}</h2>
          <div className="mt-2">{children}</div>
        </div>
        <ArrowRight size={16} className="text-ocean-400 flex-shrink-0 mt-1" />
      </div>
    </a>
  );
}
