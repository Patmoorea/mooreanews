import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { PosterImage } from "@/components/PosterImage";
import { hasPoster } from "@/lib/has-poster";
import { PublicationCard } from "@/components/PublicationCard";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { getFeaturedArticles, getArticles } from "@/lib/content";
import type { Article } from "@/lib/content-types";
import { formatDateShortFR, timeAgo, truncate } from "@/lib/utils";

export async function FeaturedArticles() {
  const [featuredAll, allArticles] = await Promise.all([
    getFeaturedArticles(),
    getArticles(),
  ]);
  const featured = featuredAll.slice(0, 2);
  const recent = allArticles.slice(0, 4);
  const hasFeatured = featured.length > 0;

  return (
    <section
      id="infos-locales"
      className="py-12 sm:py-16 scroll-mt-36 md:scroll-mt-44"
    >
      <Container>
        <div className="flex items-end justify-between mb-10">
          <div>
            {hasFeatured ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lagon-100 text-lagon-700 text-xs font-semibold uppercase tracking-widest border border-lagon-200/60">
                <span aria-hidden>📰</span>
                À la une
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-100 text-ocean-700 text-xs font-semibold uppercase tracking-widest border border-ocean-200/60">
                <span aria-hidden>📰</span>
                Actualités
              </span>
            )}
            <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ocean-950">
              {hasFeatured ? "À la une & dernières actualités" : "Dernières actualités"}
            </h2>
          </div>
          <Link
            href="/actualites"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-ocean-700 hover:text-tiare-600 transition-colors"
          >
            Tout voir
            <ArrowRight size={16} />
          </Link>
        </div>

        <div
          className={
            hasFeatured
              ? "grid lg:grid-cols-3 gap-6"
              : "grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          }
        >
          {hasFeatured &&
            featured.map((a, idx) => (
            <Link
              href={`/actualites/${a.slug}`}
              key={a.slug}
              className={`group relative overflow-hidden rounded-3xl bg-white border border-ocean-100 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:-translate-y-1 transition-all block ${
                idx === 0 ? "lg:row-span-2" : ""
              }`}
            >
              {hasPoster(a.image) ? (
                <PosterImage
                  src={a.image!}
                  alt={`Affiche — ${a.title}`}
                  className={`w-full rounded-none border-0 border-b border-ocean-100 ${
                    idx === 0
                      ? "aspect-[3/4] max-h-[min(70vh,520px)]"
                      : "aspect-[3/4] max-h-52"
                  }`}
                />
              ) : (
                <ContentCoverImage
                  src={a.image}
                  alt={a.title}
                  category={a.category}
                  slug={a.slug}
                  className="aspect-[16/10]"
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              )}
              <div className="absolute top-4 left-4 z-10">
                <Badge variant="tiare">À la une</Badge>
              </div>
              <div className="p-6 sm:p-7">
                <div className="flex items-center gap-3 text-xs text-ocean-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDateShortFR(a.publishedAt)}
                  </span>
                  {a.author && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {a.author}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-display text-2xl text-ocean-900 leading-tight group-hover:text-tiare-600 transition-colors">
                  {a.title}
                </h3>
                <p className="mt-3 text-ocean-700 text-pretty">
                  {truncate(a.excerpt, 220)}
                </p>
              </div>
            </Link>
            ))}

          <div
            className={
              hasFeatured
                ? "grid gap-4 lg:col-start-3 lg:row-start-1 lg:row-span-2 self-start"
                : "contents sm:contents"
            }
          >
            {(hasFeatured ? recent.slice(featured.length) : recent).map((a) => (
              <ArticleHomeCard key={a.slug} article={a} compact={hasFeatured} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ArticleHomeCard({
  article: a,
  compact,
}: {
  article: Article;
  compact?: boolean;
}) {
  return (
    <PublicationCard
      href={`/actualites/${a.slug}`}
      title={a.title}
      image={a.image}
      imageAlt={`Affiche — ${a.title}`}
      className="hover:border-tiare-300"
    >
      <div className="flex items-center gap-2 text-xs text-ocean-500 mb-1">
        <Badge variant="lagon">{a.category}</Badge>
        <span>{timeAgo(a.publishedAt)}</span>
      </div>
      <h4
        className={`font-display text-ocean-900 group-hover:text-tiare-600 transition-colors ${
          compact ? "text-lg" : "text-lg sm:text-xl"
        }`}
      >
        {a.title}
      </h4>
      <p className="mt-1 text-sm text-ocean-600 line-clamp-2">
        {truncate(a.excerpt, compact ? 110 : 140)}
      </p>
    </PublicationCard>
  );
}
