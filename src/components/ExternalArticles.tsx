import Link from "next/link";
import { ExternalLink, Rss, Settings } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { listExternalArticles } from "@/lib/aggregator";
import { FACEBOOK_WATCH_URLS } from "@/lib/watch-sources";
import { timeAgo } from "@/lib/utils";

export async function ExternalArticles({ limit = 8 }: { limit?: number }) {
  const articles = await listExternalArticles(limit);
  const hasArticles = articles && articles.length > 0;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-ocean-50">
      <Container>
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-100 text-ocean-700 text-xs font-semibold uppercase tracking-widest">
              <Rss size={12} />
              Veille externe
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl text-ocean-950">
              Moorea sur le web & Facebook
            </h2>
            <p className="mt-1 text-sm text-ocean-600 max-w-2xl">
              Presse locale, Google Actualités, page de la commune et groupe
              Facebook — collecte automatique toutes les heures (si le cron
              Vercel est configuré).
            </p>
          </div>
        </div>

        {hasArticles ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {articles!.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 bg-white rounded-2xl border border-ocean-100 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] transition-all"
                >
                  {a.image_url ? (
                    <img
                      src={a.image_url}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-lagon-200 to-tipanier-200 flex-shrink-0 flex items-center justify-center text-2xl">
                      📘
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-lagon-600 font-semibold">
                        {a.source_name}
                      </span>
                      <time className="text-[10px] text-ocean-500">
                        {timeAgo(a.published_at)}
                      </time>
                    </div>
                    <h3 className="font-display text-base text-ocean-900 leading-tight group-hover:text-tiare-600 transition-colors">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="mt-1 text-xs text-ocean-600 line-clamp-2">
                        {a.excerpt}
                      </p>
                    )}
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-ocean-300 flex-shrink-0 mt-1 group-hover:text-tiare-500"
                  />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-ocean-100 bg-white p-6 sm:p-8">
            <p className="font-semibold text-ocean-900 flex items-center gap-2">
              <Settings size={18} className="text-lagon-600" />
              Aucune collecte en base pour l&apos;instant
            </p>
            <p className="mt-2 text-sm text-ocean-700">
              Les liens ci-dessous sont déjà surveillés par le code (commune,
              groupe Facebook). Pour les voir ici automatiquement : configurez
              Supabase + le cron sur Vercel, puis lancez une première collecte.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {FACEBOOK_WATCH_URLS.map((w) => (
                <li key={w.url}>
                  <a
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-3 rounded-xl border border-ocean-100 hover:border-tiare-300 text-sm"
                  >
                    <ExternalLink size={14} className="text-tiare-500 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-medium text-ocean-900 block">
                        {w.label}
                      </span>
                      <span className="text-xs text-ocean-500 line-clamp-1">
                        {w.url}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ocean-600">
              Admin connecté :{" "}
              <Link href="/admin/external" className="text-tiare-600 font-semibold hover:underline">
                Veille externe → Agréger maintenant
              </Link>
              . Voir aussi{" "}
              <code className="text-[10px] bg-ocean-50 px-1 rounded">CONFIGURATION.md</code>{" "}
              (variables <code className="text-[10px] bg-ocean-50 px-1 rounded">CRON_SECRET</code>,{" "}
              <code className="text-[10px] bg-ocean-50 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code>
              ).
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}
