import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { ArticlesFilter } from "@/components/ArticlesFilter";
import { ExternalArticles } from "@/components/ExternalArticles";
import { getArticles } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Actualités de Moorea",
  description:
    "Toute l'actualité de Moorea : événements communaux, environnement, transport, santé, vie locale.",
};

export default async function ActualitesPage() {
  const articles = await getArticles();

  return (
    <>
      <PageHeader
        badge="Actualités"
        title="Tout ce qui bouge à Moorea"
        description="Les nouvelles de l'île, mises à jour régulièrement. Économie, culture, environnement, transport, santé."
        variant="lagon"
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-lagon-50 border border-lagon-200 text-sm text-ocean-800">
          <Users size={20} className="text-lagon-600 shrink-0" aria-hidden />
          <p>
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
          </p>
        </div>
        <ArticlesFilter articles={articles} />
      </Container>

      <ExternalArticles limit={8} />
    </>
  );
}
