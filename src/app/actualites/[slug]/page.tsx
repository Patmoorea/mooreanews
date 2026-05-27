import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, User, Tag } from "lucide-react";
import { ContentCoverImage } from "@/components/ContentCoverImage";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { resolveCoverImage } from "@/lib/cover-image";
import { ShareButtons } from "@/components/ShareButtons";
import { getArticleBySlug, getArticles } from "@/lib/content";
import { formatDateFR } from "@/lib/utils";
import { SITE } from "@/lib/constants";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article introuvable" };
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/actualites/${article.slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      authors: article.author ? [article.author] : undefined,
      tags: article.tags,
      images: [
        {
          url: resolveCoverImage({
            image: article.image,
            category: article.category,
          }),
        },
      ],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const all = await getArticles();
  const related = all
    .filter((a) => a.slug !== article.slug && a.category === article.category)
    .slice(0, 3);

  const shareUrl = `${SITE.url}/actualites/${article.slug}`;

  return (
    <article>
      {/* Hero article */}
      <section className="relative overflow-hidden bg-gradient-to-b from-lagon-100 via-ocean-50 to-white">
        <div
          aria-hidden
          className="absolute inset-0 bg-tapa opacity-40 pointer-events-none"
        />
        <Container className="relative py-12 sm:py-16">
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 text-sm text-ocean-600 hover:text-tiare-600 mb-6"
          >
            <ArrowLeft size={16} />
            Retour aux actualités
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="lagon">{article.category}</Badge>
            {article.featured && <Badge variant="tiare">À la une</Badge>}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-balance leading-[1.1] text-ocean-950">
            {article.title}
          </h1>

          <p className="mt-5 text-xl text-ocean-700 max-w-3xl text-pretty">
            {article.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ocean-600">
            <span className="flex items-center gap-2">
              <Calendar size={14} />
              {formatDateFR(article.publishedAt)}
            </span>
            {article.author && (
              <span className="flex items-center gap-2">
                <User size={14} />
                {article.author}
              </span>
            )}
            {article.tags && article.tags.length > 0 && (
              <span className="flex items-center gap-2">
                <Tag size={14} />
                {article.tags.join(", ")}
              </span>
            )}
          </div>
        </Container>
      </section>

      <Container>
        <ContentCoverImage
          src={article.image}
          alt={article.title}
          category={article.category}
          slug={article.slug}
          className="aspect-[16/8] -mt-4 sm:-mt-8 rounded-3xl shadow-[var(--shadow-tropical)]"
          sizes="(max-width: 1200px) 100vw, 1200px"
          priority
          overlay={false}
        />
      </Container>

      {/* Corps de l'article */}
      <Container size="narrow" className="py-12 sm:py-16">
        <div className="prose-tropical">
          {article.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-lg leading-relaxed text-ocean-900 mb-6">
              {para}
            </p>
          ))}
        </div>

        {/* Partage */}
        <div className="mt-12 pt-8 border-t border-ocean-100">
          <ShareButtons
            url={shareUrl}
            title={article.title}
            description={article.excerpt}
          />
        </div>
      </Container>

      {/* Articles liés */}
      {related.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-ocean-50 to-white">
          <Container>
            <h2 className="font-display text-2xl sm:text-3xl text-ocean-950 mb-8">
              À lire aussi
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <Link
                  key={a.slug}
                  href={`/actualites/${a.slug}`}
                  className="group bg-white rounded-2xl border border-ocean-100 overflow-hidden hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] hover:-translate-y-1 transition-all"
                >
                  <ContentCoverImage
                    src={a.image}
                    alt={a.title}
                    category={a.category}
                    slug={a.slug}
                    className="aspect-[16/10]"
                  />
                  <div className="p-5">
                    <Badge variant="lagon">{a.category}</Badge>
                    <h3 className="mt-2 font-display text-lg text-ocean-900 group-hover:text-tiare-600 transition-colors">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-sm text-ocean-600 line-clamp-2">
                      {a.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* JSON-LD Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: article.title,
            description: article.excerpt,
            datePublished: article.publishedAt,
            author: article.author
              ? { "@type": "Person", name: article.author }
              : undefined,
            publisher: {
              "@type": "Organization",
              name: SITE.name,
              logo: { "@type": "ImageObject", url: `${SITE.url}${SITE.logo}` },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": shareUrl,
            },
            keywords: article.tags?.join(", "),
          }),
        }}
      />
    </article>
  );
}
