import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/PageHeader";
import { ArticlesFilter } from "@/components/ArticlesFilter";
import { getArticles } from "@/lib/content";

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
        <ArticlesFilter articles={articles} />
      </Container>
    </>
  );
}
