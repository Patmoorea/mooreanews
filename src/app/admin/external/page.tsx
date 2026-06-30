import { ExternalLink, RefreshCw, Search } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { RSS_SOURCES, sortSourcesByPriority } from "@/lib/rss-sources";
import {
  FACEBOOK_PAGE_WATCHES,
  FACEBOOK_WATCH_URLS,
} from "@/lib/watch-sources";
import { AddFacebookLinkForm } from "@/components/admin/AddFacebookLinkForm";
import { PurgeObsoleteVeilleBanner } from "@/components/admin/PurgeObsoleteVeilleBanner";
import { runAggregation, toggleExternalArticle } from "@/app/admin/external-actions";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Veille externe" };

type PageProps = {
  searchParams: Promise<{ q?: string; purged?: string }>;
};

export default async function AdminExternalPage({ searchParams }: PageProps) {
  const { q, purged } = await searchParams;
  const query = q?.trim() ?? "";

  const supabase = await getServerSupabase();
  let articlesQuery = supabase
    ?.from("external_articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (query) {
    articlesQuery = articlesQuery?.ilike("title", `%${query}%`).limit(40);
  } else {
    articlesQuery = articlesQuery?.limit(80);
  }

  const { data: articles } = (await articlesQuery) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Veille externe"
        description="RSS, Google Actualités et liens Facebook — collecte automatique chaque soir (~18h, Tahiti). Menu latéral : « Veille RSS »."
      />

      {purged !== undefined && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            Number(purged) > 0
              ? "bg-green-100 text-green-900 border border-green-300"
              : "bg-ocean-100 text-ocean-800 border border-ocean-200"
          }`}
        >
          {Number(purged) > 0
            ? `✅ ${purged} entrée(s) de veille obsolète(s) masquée(s).`
            : "Aucune entrée obsolète visible à masquer (déjà fait ou introuvable)."}
        </div>
      )}

      <PurgeObsoleteVeilleBanner />

      <section className="mb-6 bg-white rounded-3xl border border-ocean-100 p-5">
        <form method="get" className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex-1 min-w-[220px]">
            <label
              htmlFor="external-q"
              className="block text-xs font-semibold text-ocean-700 mb-1"
            >
              Rechercher un titre (veille RSS)
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ocean-400"
              />
              <input
                id="external-q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="ex. TAPUAE MANU"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-ocean-200 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-ocean-800 text-white text-sm font-semibold"
          >
            Chercher
          </button>
          {query && (
            <a
              href="/admin/external"
              className="text-sm text-ocean-600 hover:text-tiare-600"
            >
              Effacer
            </a>
          )}
        </form>
        {query && (
          <p className="text-xs text-ocean-600 mb-2">
            {articles?.length ?? 0} résultat(s) pour « {query} » — les vieilles
            entrées ne sont pas dans les 80 derniers sans recherche.
          </p>
        )}

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg text-ocean-900">
              Sources surveillées ({RSS_SOURCES.length})
            </h2>
            <p className="text-xs text-ocean-500 mt-1">
              Cron Vercel : 1×/jour à 18h (Tahiti). Bouton « Agréger maintenant »
              pour forcer une collecte immédiate.
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
          {sortSourcesByPriority(RSS_SOURCES).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between p-3 rounded-xl bg-ocean-50 text-sm"
            >
              <div>
                <p className="font-medium text-ocean-900">{s.name}</p>
              <p className="text-xs text-ocean-500 truncate max-w-xs">
                {s.url}
                {s.priority != null && s.priority <= 5 ? " · ★ officiel" : ""}
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

        <div className="mt-6 border-t border-ocean-100 pt-4">
          <h3 className="text-sm font-semibold text-ocean-900">
            Facebook surveillé ({FACEBOOK_WATCH_URLS.length} liens)
          </h3>
          <p className="text-xs text-ocean-500 mt-1 mb-2">
            Open Graph à chaque passage du cron. Ajoutez des permalinks via{" "}
            <code className="text-[10px] bg-ocean-100 px-1 rounded">
              FACEBOOK_WATCH_URLS
            </code>{" "}
            (Vercel) ou le formulaire ci-dessous.
          </p>
          <ul className="space-y-1.5 text-xs text-ocean-700">
            {FACEBOOK_WATCH_URLS.map((w) => (
              <li key={w.url} className="truncate">
                <a
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-tiare-600"
                >
                  {w.label}
                </a>
              </li>
            ))}
          </ul>
          {FACEBOOK_PAGE_WATCHES.length > 0 && (
            <p className="text-xs text-ocean-600 mt-3">
              Pages API Meta (si{" "}
              <code className="bg-ocean-100 px-1 rounded text-[10px]">
                FACEBOOK_PAGE_ACCESS_TOKEN
              </code>
              ) :{" "}
              {FACEBOOK_PAGE_WATCHES.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>

        <AddFacebookLinkForm />
      </section>

      <h2 className="font-display text-xl text-ocean-900 mb-3">
        {query
          ? `Résultats veille (${articles?.length ?? 0})`
          : `Derniers articles agrégés (${articles?.length ?? 0})`}
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
                  {query ? (
                    <>
                      Aucun résultat pour « {query} ».
                      <br />
                      Essayez un mot-clé plus court (ex. <strong>TAPUAE</strong>).
                    </>
                  ) : (
                    <>
                      Aucun article agrégé pour l&apos;instant.
                      <br />
                      Cliquez sur <strong>Agréger maintenant</strong> pour lancer
                      une première collecte.
                    </>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
