import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
  Eye,
  Globe,
  Monitor,
  Users,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getVisitStats } from "@/lib/page-analytics";

export const metadata = { title: "Statistiques" };

function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Tahiti",
  });
}

export default async function AdminAnalyticsPage() {
  const stats = await getVisitStats();
  const maxDaily = Math.max(...stats.daily.map((d) => d.views), 1);

  return (
    <div>
      <AdminPageHeader
        title="Statistiques de visites"
        description={`Suivi gratuit intégré — ${stats.periodDays} derniers jours (heure de Tahiti). Données anonymes, stockées dans votre Supabase.`}
      />

      {!stats.configured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Table Supabase manquante</p>
          <p className="mt-1 text-amber-800">
            Exécutez{" "}
            <code className="rounded bg-amber-100 px-1">
              supabase/prod-setup-all.sql
            </code>{" "}
            puis{" "}
            <code className="rounded bg-amber-100 px-1">
              supabase/page-analytics-v2.sql
            </code>{" "}
            dans l&apos;éditeur SQL Supabase.
          </p>
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-lagon-200 bg-lagon-50 p-4 text-sm text-ocean-800">
        <p className="font-semibold">100 % gratuit — 3 sources complémentaires</p>
        <ul className="mt-2 space-y-1 list-disc list-inside text-ocean-700">
          <li>
            <strong>Cette page</strong> — pages vues, visiteurs, referrers, appareils
            (30 j)
          </li>
          <li>
            <strong>Vercel Analytics</strong> — pays, Web Vitals (activer dans le
            dashboard Vercel → projet → Analytics)
          </li>
          <li>
            <strong>Google Search Console</strong> — SEO / recherches Google (gratuit)
          </li>
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <section className="sm:col-span-2 lg:col-span-3 rounded-3xl border-2 border-lagon-200 bg-gradient-to-br from-lagon-50 to-white p-6">
          <h2 className="font-display text-xl text-ocean-900 mb-1">
            Rapport hebdomadaire (7 jours)
          </h2>
          <p className="text-sm text-ocean-600 mb-6">
            Résumé pour piloter votre audience — heure Tahiti.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <MiniStat label="Pages vues (7 j)" value={stats.weekViews} />
            <MiniStat label="Visiteurs uniques (7 j)" value={stats.weekVisitors} />
            <MiniStat
              label="Moyenne / jour"
              value={Math.round(stats.weekViews / 7)}
            />
            <MiniStat label="Aujourd'hui" value={stats.todayViews} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-ocean-800 mb-3">
                Top articles (7 j)
              </h3>
              {stats.topArticles.length === 0 ? (
                <p className="text-sm text-ocean-500">—</p>
              ) : (
                <ol className="space-y-2">
                  {stats.topArticles.slice(0, 5).map((a, i) => (
                    <li
                      key={a.path}
                      className="flex justify-between gap-3 text-sm border-b border-ocean-50 pb-2"
                    >
                      <span className="truncate">
                        <span className="text-ocean-400 mr-2">{i + 1}.</span>
                        {a.title}
                      </span>
                      <span className="font-medium shrink-0">{a.views}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ocean-800 mb-3">
                Campagnes UTM (7 j)
              </h3>
              {stats.utmSources.length === 0 ? (
                <p className="text-sm text-ocean-500">
                  Les liens avec{" "}
                  <code className="text-xs">?utm_source=</code> (Facebook Ads,
                  WhatsApp, etc.) apparaîtront ici.
                </p>
              ) : (
                <ol className="space-y-2">
                  {stats.utmSources.map((u) => (
                    <li
                      key={u.source}
                      className="flex justify-between text-sm border-b border-ocean-50 pb-2"
                    >
                      <span>{u.source}</span>
                      <span className="font-medium">{u.views}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatBox
          label="Pages vues aujourd'hui"
          value={stats.todayViews}
          icon={<Eye size={18} />}
        />
        <StatBox
          label="Visiteurs aujourd'hui"
          value={stats.todayVisitors}
          icon={<Users size={18} />}
          hint="ID anonyme navigateur"
        />
        <StatBox
          label={`Pages vues (${stats.periodDays} j)`}
          value={stats.monthViews}
          icon={<BarChart3 size={18} />}
        />
        <StatBox
          label={`Visiteurs (${stats.periodDays} j)`}
          value={stats.monthVisitors}
          icon={<Users size={18} />}
        />
        <StatBox
          label="Pages vues (7 j)"
          value={stats.weekViews}
          icon={<BarChart3 size={18} />}
        />
        <StatBox
          label="Visiteurs (7 j)"
          value={stats.weekVisitors}
          icon={<Users size={18} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <section className="rounded-3xl border border-ocean-100 bg-white p-6">
          <h2 className="font-display text-xl text-ocean-900 mb-4 flex items-center gap-2">
            <Globe size={20} className="text-lagon-600" />
            Sources de trafic ({stats.periodDays} j)
          </h2>
          {stats.topReferrers.length === 0 ? (
            <p className="text-sm text-ocean-500">Aucune donnée referrer.</p>
          ) : (
            <ol className="space-y-2">
              {stats.topReferrers.map((r, i) => (
                <li
                  key={r.source}
                  className="flex justify-between gap-4 text-sm border-b border-ocean-50 pb-2 last:border-0"
                >
                  <span>
                    <span className="text-ocean-400 mr-2">{i + 1}.</span>
                    {r.source}
                  </span>
                  <span className="font-medium text-ocean-900">{r.views}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-3xl border border-ocean-100 bg-white p-6">
          <h2 className="font-display text-xl text-ocean-900 mb-4 flex items-center gap-2">
            <Monitor size={20} className="text-ocean-600" />
            Appareils ({stats.periodDays} j)
          </h2>
          {stats.devices.length === 0 ? (
            <p className="text-sm text-ocean-500">
              Les types d&apos;appareil apparaîtront après{" "}
              <code className="text-xs">page-analytics-v2.sql</code> et de
              nouvelles visites.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.devices.map((d) => (
                <li key={d.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ocean-800">{d.type}</span>
                    <span className="font-medium">
                      {d.views} ({d.pct}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ocean-50 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-lagon-500"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mb-8 rounded-3xl border border-ocean-100 bg-white p-6">
        <h2 className="font-display text-xl text-ocean-900 mb-4">
          Évolution sur {stats.periodDays} jours
        </h2>
        {stats.daily.length === 0 ? (
          <p className="text-sm text-ocean-500">
            Aucune donnée. Visitez le site public (hors /admin) pour enregistrer
            des pages vues.
          </p>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-2">
            {stats.daily.map((day) => (
              <div key={day.date} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-ocean-600 text-xs">
                  {formatDay(day.date)}
                </span>
                <div className="flex-1 h-6 rounded-full bg-ocean-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lagon-400 to-ocean-600"
                    style={{ width: `${(day.views / maxDaily) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right font-medium text-ocean-900">
                  {day.views}
                </span>
                <span className="w-14 text-right text-ocean-500 text-xs hidden sm:block">
                  {day.visitors} vis.
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-3xl border border-ocean-100 bg-white p-6">
        <h2 className="font-display text-xl text-ocean-900 mb-4">
          Pages les plus consultées ({stats.periodDays} j)
        </h2>
        {stats.topPages.length === 0 ? (
          <p className="text-sm text-ocean-500">—</p>
        ) : (
          <ol className="space-y-2">
            {stats.topPages.map((p, i) => (
              <li
                key={p.path}
                className="flex items-center justify-between gap-4 text-sm border-b border-ocean-50 pb-2 last:border-0"
              >
                <span className="text-ocean-400 w-6">{i + 1}.</span>
                <Link
                  href={p.path}
                  className="flex-1 truncate text-ocean-800 hover:text-tiare-600"
                  target="_blank"
                >
                  {p.path}
                </Link>
                <span className="font-medium text-ocean-900">{p.views}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-3xl border border-ocean-100 bg-gradient-to-br from-ocean-50 to-lagon-50 p-6">
        <h2 className="font-display text-xl text-ocean-900 mb-2">
          Vercel Web Analytics (gratuit, complément)
        </h2>
        <p className="text-sm text-ocean-700 mb-4">
          Dans Vercel → projet <strong>mooreanews</strong> → onglet{" "}
          <strong>Analytics</strong> → activer <strong>Web Analytics</strong>.
          Donne pays, navigateurs et performances (Core Web Vitals) sans cookie
          invasif. Le composant est déjà installé dans le code du site.
        </p>
        <a
          href="https://vercel.com/docs/analytics"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white border border-ocean-200 px-4 py-2 text-sm font-medium text-ocean-800 hover:border-tiare-400"
        >
          Documentation Vercel Analytics
          <ExternalLink size={14} />
        </a>
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white border border-ocean-100 p-4">
      <p className="text-[10px] uppercase tracking-wide text-ocean-500">{label}</p>
      <p className="font-display text-2xl text-ocean-950 mt-1">{value}</p>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-ocean-100 bg-white p-5">
      <div className="flex items-center gap-2 text-ocean-500 mb-2">
        {icon}
        <p className="text-xs uppercase tracking-wide">{label}</p>
      </div>
      <p className="font-display text-3xl text-ocean-950">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-ocean-400">{hint}</p>}
    </div>
  );
}
