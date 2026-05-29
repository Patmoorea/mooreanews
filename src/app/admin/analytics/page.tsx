import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, ExternalLink, Eye, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getVisitStats } from "@/lib/page-analytics";

export const metadata: Metadata = { title: "Statistiques" };

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
        description="Pages vues et visiteurs anonymes (7 derniers jours, fuseau Tahiti)."
      />

      {!stats.configured && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Table Supabase manquante</p>
          <p className="mt-1 text-amber-800">
            Exécutez le script{" "}
            <code className="rounded bg-amber-100 px-1">supabase/page-analytics.sql</code>{" "}
            dans l&apos;éditeur SQL Supabase pour activer le suivi.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatBox
          label="Pages vues aujourd'hui"
          value={stats.todayViews}
          icon={<Eye size={18} />}
        />
        <StatBox
          label="Visiteurs aujourd'hui"
          value={stats.todayVisitors}
          icon={<Users size={18} />}
          hint="Identifiant anonyme navigateur"
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

      <section className="mb-8 rounded-3xl border border-ocean-100 bg-white p-6">
        <h2 className="font-display text-xl text-ocean-900 mb-4">
          Évolution sur 7 jours
        </h2>
        {stats.daily.length === 0 ? (
          <p className="text-sm text-ocean-500">
            Aucune donnée pour l&apos;instant. Les stats apparaîtront dès les
            premières visites sur le site public.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.daily.map((day) => (
              <div key={day.date} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-ocean-600">
                  {formatDay(day.date)}
                </span>
                <div className="flex-1 h-7 rounded-full bg-ocean-50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lagon-400 to-ocean-600 transition-all"
                    style={{ width: `${(day.views / maxDaily) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right font-medium text-ocean-900">
                  {day.views}
                </span>
                <span className="w-20 text-right text-ocean-500 hidden sm:block">
                  {day.visitors} vis.
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8 rounded-3xl border border-ocean-100 bg-white p-6">
        <h2 className="font-display text-xl text-ocean-900 mb-4">
          Pages les plus consultées (7 j)
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
          Vercel Analytics (recommandé)
        </h2>
        <p className="text-sm text-ocean-700 mb-4">
          Pour des métriques avancées (pays, appareils, Web Vitals), activez
          Web Analytics dans le tableau de bord Vercel du projet MooreaNews.
        </p>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-white border border-ocean-200 px-4 py-2 text-sm font-medium text-ocean-800 hover:border-tiare-400"
        >
          Ouvrir Vercel
          <ExternalLink size={14} />
        </a>
      </section>
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
