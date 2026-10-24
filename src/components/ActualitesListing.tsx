import Link from "next/link";
import { Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { ArticlesFilter } from "@/components/ArticlesFilter";
import { AdSlot } from "@/components/ads/AdSlot";
import { ExternalArticles } from "@/components/ExternalArticles";
import { getArticles } from "@/lib/content";
import { withoutStaleGarde } from "@/lib/article-url";
import { truncate } from "@/lib/utils";
import type { Article } from "@/lib/content-types";

export const ARTICLES_PER_PAGE = 24;

/** Liste publique allégée : sans anciennes gardes, sans corps d'article. */
export async function getListedArticles(): Promise<Article[]> {
  const all = withoutStaleGarde(await getArticles());
  return all.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: truncate(a.excerpt ?? "", 200),
    body: "",
    category: a.category,
    publishedAt: a.publishedAt,
    author: a.author,
    image: a.image,
    featured: a.featured,
  }));
}

export async function ActualitesListing({ page }: { page: number }) {
  const listed = await getListedArticles();
  const totalPages = Math.max(1, Math.ceil(listed.length / ARTICLES_PER_PAGE));
  const articles = listed.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);

  return (
    <>
      <PageHeader
        badge="Actualités"
        title="Tout ce qui bouge à Moorea"
        description="Les nouvelles de l'île, mises à jour régulièrement. Économie, culture, environnement, transport, santé."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-lagon-50 border border-lagon-200 text-sm text-ocean-800">
          <p className="flex items-start gap-2">
            <Users size={20} className="text-lagon-600 shrink-0 mt-0.5" aria-hidden />
            <span>
              Associations de l&apos;île (Te Mana O Te Moana, PGEM, Tāhei&apos;Autī…), groupes
              Facebook et veille :{" "}
              <Link
                href="/associations"
                className="font-semibold text-tiare-600 hover:underline"
              >
                page Associations
              </Link>
              {" · "}
              <Link
                href="/infos-pratiques#communaute"
                className="font-semibold text-tiare-600 hover:underline"
              >
                Infos pratiques — Communauté
              </Link>
            </span>
          </p>
          <Link
            href="/actualites/feed.xml"
            className="shrink-0 font-semibold text-lagon-700 hover:text-tiare-600 hover:underline"
          >
            Flux RSS
          </Link>
        </div>
        <AdSlot slotId="actualites-top" />
        <ArticlesFilter articles={articles} showInlineAds />
        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
            {page > 1 ? (
              <Link
                rel="prev"
                href={page === 2 ? "/actualites" : `/actualites/page/${page - 1}`}
                className="px-4 py-2 rounded-full border border-ocean-200 bg-white font-semibold text-ocean-700 hover:border-tiare-300"
              >
                ← Plus récents
              </Link>
            ) : null}
            <span className="px-3 text-ocean-600">
              Page {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                rel="next"
                href={`/actualites/page/${page + 1}`}
                className="px-4 py-2 rounded-full border border-ocean-200 bg-white font-semibold text-ocean-700 hover:border-tiare-300"
              >
                Plus anciens →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </Container>

      <ExternalArticles limit={8} />
    </>
  );
}
