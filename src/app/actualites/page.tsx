import type { Metadata } from "next";
import { Calendar, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { getArticles } from "@/lib/content";
import { formatDateShortFR, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Actualités de Moorea",
  description:
    "Toute l'actualité de Moorea : événements communaux, environnement, transport, santé, vie locale.",
};

export default function ActualitesPage() {
  const articles = getArticles();

  return (
    <>
      <PageHeader
        badge="Actualités"
        title="Tout ce qui bouge à Moorea"
        description="Les nouvelles de l'île, mises à jour régulièrement. Économie, culture, environnement, transport, santé."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <article
              key={a.slug}
              className="group bg-white rounded-2xl border border-ocean-100 overflow-hidden shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-tropical)] hover:-translate-y-1 transition-all"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-lagon-200 via-tipanier-200 to-soleil-200 relative">
                {a.featured && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="tiare">À la une</Badge>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-ocean-500 mb-2">
                  <Badge variant="lagon">{a.category}</Badge>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDateShortFR(a.publishedAt)}
                  </span>
                </div>
                <h2 className="font-display text-xl text-ocean-900 leading-tight group-hover:text-tiare-600 transition-colors">
                  {a.title}
                </h2>
                <p className="mt-2 text-sm text-ocean-600">
                  {truncate(a.excerpt, 160)}
                </p>
                {a.author && (
                  <p className="mt-3 text-xs text-ocean-500 flex items-center gap-1">
                    <User size={12} />
                    {a.author}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </>
  );
}
