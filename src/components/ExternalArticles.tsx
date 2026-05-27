import { ExternalLink, Rss } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { listExternalArticles } from "@/lib/aggregator";
import { timeAgo } from "@/lib/utils";

export async function ExternalArticles({ limit = 8 }: { limit?: number }) {
  const articles = await listExternalArticles(limit);
  if (!articles || articles.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-ocean-50">
      <Container>
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-100 text-ocean-700 text-xs font-semibold uppercase tracking-widest">
              <Rss size={12} />
              Veille externe
            </span>
            <h2 className="mt-3 font-display text-2xl sm:text-3xl text-ocean-950">
              Moorea dans la presse
            </h2>
            <p className="mt-1 text-sm text-ocean-600">
              Presse locale, Google Actualités et publications Facebook repérées
              automatiquement.
            </p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {articles.map((a) => (
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
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-lagon-200 to-tipanier-200 flex-shrink-0" />
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
      </Container>
    </section>
  );
}
