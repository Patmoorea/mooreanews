import { ExternalLink, RefreshCw } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RSS_SOURCES } from "@/lib/rss-sources";
import { runAggregation, toggleExternalArticle } from "@/app/admin/external-actions";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Veille RSS" };

export default async function AdminExternalPage() {
  const supabase = await getServerSupabase();
  const { data: articles } =
    (await supabase
      ?.from("external_articles")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(50)) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Veille externe"
        description="Articles mentionnant Moorea agrégés depuis les médias locaux."
      />

      <section className="mb-6 bg-white rounded-3xl border border-ocean-100 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg text-ocean-900">
              Sources surveillées ({RSS_SOURCES.length})
            </h2>
            <p className="text-xs text-ocean-500 mt-1">
              Agrégation automatique toutes les heures via Vercel Cron.
            </p>
          </div>
          <form action={runAggregation}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white text-sm font-semibold hover:-translate-y-0.5 transition-transform"
            >
              <RefreshCw size={14} />
              Agréger maintenant
            </button>
          </form>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2">
          {RSS_SOURCES.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-ocean-50 text-sm"
            >
              <div>
                <p className="font-medium text-ocean-900">{s.name}</p>
                <p className="text-xs text-ocean-500 truncate max-w-xs">
                  {s.url}
                </p>
              </div>
              <a
                href={s.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean-400 hover:text-tiare-600"
              >
                <ExternalLink size={14} />
              </a>
            </li>
          ))}
        </ul>
      </section>

      <h2 className="font-display text-xl text-ocean-900 mb-3">
        Derniers articles agrégés ({articles?.length ?? 0})
      </h2>

      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Source</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Publié</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(articles ?? []).map((a) => (
              <tr key={a.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-ocean-900 hover:text-tiare-600 inline-flex items-center gap-1.5"
                  >
                    {a.hidden && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ocean-200 text-ocean-600">
                        Masqué
                      </span>
                    )}
                    {a.title}
                    <ExternalLink size={10} className="text-ocean-400" />
                  </a>
                  {a.excerpt && (
                    <p className="text-xs text-ocean-500 mt-1 line-clamp-1 max-w-xl">
                      {a.excerpt}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded-full bg-lagon-100 text-lagon-700 text-xs font-semibold">
                    {a.source_name}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-600 text-xs">
                  {timeAgo(a.published_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async (fd) => {
                      "use server";
                      await toggleExternalArticle(a.id, !a.hidden);
                    }}
                    className="inline"
                  >
                    <button
                      type="submit"
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        a.hidden
                          ? "bg-ocean-100 text-ocean-700 hover:bg-tipanier-100"
                          : "bg-tipanier-100 text-tipanier-700 hover:bg-ocean-100"
                      }`}
                    >
                      {a.hidden ? "Afficher" : "Masquer"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(articles ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-ocean-500">
                  Aucun article agrégé pour l&apos;instant.
                  <br />
                  Cliquez sur <strong>Agréger maintenant</strong> pour lancer
                  une première collecte.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
