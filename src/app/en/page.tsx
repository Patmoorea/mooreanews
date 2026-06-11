import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Ship, Sun, Waves, AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getMooreaDuJour } from "@/lib/moorea-du-jour";
import { SITE, USEFUL_LINKS } from "@/lib/constants";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Moorea Guide — English",
  description:
    "Moorea island daily essentials: ferries Tahiti–Moorea, weather, lagoon, alerts and events. Full details on MooreaNews.",
  alternates: { canonical: "/en" },
};

export default async function EnglishPage() {
  const data = await getMooreaDuJour();

  return (
    <div className="min-h-screen bg-island-sky">
      <header className="bg-ocean-900 text-white py-8">
        <Container>
          <p className="text-lagon-300 text-sm font-semibold uppercase tracking-widest">
            Ia ora na — Welcome
          </p>
          <h1 className="font-display text-3xl sm:text-4xl mt-2">
            MooreaNews — Your island guide
          </h1>
          <p className="mt-3 text-ocean-200 max-w-2xl">
            Daily essentials for Moorea, French Polynesia: ferries, weather,
            lagoon conditions, alerts and events. Tap any section for full
            details on our French site.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-lagon-500 hover:bg-lagon-400 font-semibold text-sm transition-colors"
          >
            Site en français
            <ArrowRight size={16} />
          </Link>
        </Container>
      </header>

      <Container className="py-12 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <EnCard icon={<Ship />} title="Ferries Tahiti ↔ Moorea">
            {data.ferries.fromMoorea[0] && (
              <p>
                Moorea → Tahiti: <strong>{data.ferries.fromMoorea[0].company}</strong>{" "}
                {data.ferries.fromMoorea[0].time}
              </p>
            )}
            {data.ferries.fromTahiti[0] && (
              <p className="mt-1">
                Tahiti → Moorea: <strong>{data.ferries.fromTahiti[0].company}</strong>{" "}
                {data.ferries.fromTahiti[0].time}
              </p>
            )}
            <Link href="/#en-direct" className="text-lagon-600 text-sm font-semibold mt-2 inline-block">
              Full schedule →
            </Link>
          </EnCard>

          <EnCard icon={<Sun />} title="Weather">
            <p className="text-2xl font-display">{data.weather.temp}°C</p>
            <p className="capitalize text-sm text-ocean-600">{data.weather.description}</p>
            <Link href="/#en-direct" className="text-lagon-600 text-sm font-semibold mt-2 inline-block">
              5-day forecast →
            </Link>
          </EnCard>

          <EnCard icon={<Waves />} title="Lagoon & tides">
            <p>{data.swim.emoji} {data.swim.status === "excellent" ? "Good conditions" : data.swim.label}</p>
            <Link href="/#en-direct" className="text-lagon-600 text-sm font-semibold mt-2 inline-block">
              Tide times →
            </Link>
          </EnCard>

          <EnCard icon={<AlertTriangle />} title={`Alerts (${data.alerts.count})`}>
            {data.alerts.count === 0 ? (
              <p className="text-sm text-ocean-600">No active alerts.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {data.alerts.items.slice(0, 2).map((a) => (
                  <li key={a.id}>{a.title}</li>
                ))}
              </ul>
            )}
            <Link href="/alertes" className="text-lagon-600 text-sm font-semibold mt-2 inline-block">
              All alerts →
            </Link>
          </EnCard>
        </div>

        <section className="bg-white rounded-2xl border border-ocean-100 p-6">
          <h2 className="font-display text-2xl text-ocean-900">Explore Moorea</h2>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {[
              { href: "/evenements", label: "Events & festivals" },
              { href: "/restaurants", label: "Restaurants" },
              { href: "/activites", label: "Activities & tours" },
              { href: "/infos-pratiques", label: "Practical info & emergency" },
              { href: "/annonces", label: "Classified ads" },
              { href: "/associations", label: "Local associations" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between p-4 rounded-xl bg-ocean-50 hover:bg-lagon-50 text-ocean-900 font-medium transition-colors"
              >
                {item.label}
                <ArrowRight size={16} className="text-lagon-600" />
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-ocean-100 p-6">
          <h2 className="font-display text-2xl text-ocean-900">Useful links</h2>
          <ul className="mt-4 space-y-2">
            {USEFUL_LINKS.slice(0, 4).map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lagon-700 hover:text-tiare-600 font-medium"
                >
                  {l.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-center text-sm text-ocean-500">
          {SITE.name} — {SITE.url}
        </p>
      </Container>
    </div>
  );
}

function EnCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="bg-white rounded-2xl border border-ocean-100 p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-2 text-lagon-600 mb-3 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
        <h2 className="font-display text-lg text-ocean-900">{title}</h2>
      </div>
      <div className="text-sm text-ocean-700">{children}</div>
    </article>
  );
}
