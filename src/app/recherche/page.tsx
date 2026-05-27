import type { Metadata } from "next";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/PageHeader";
import { SearchBar } from "@/components/layout/SearchBar";
import { searchAll } from "@/lib/search";

export const metadata: Metadata = {
  title: "Recherche",
  description: "Rechercher dans toute la base de MooreaNews.",
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

const BADGE_VARIANTS = {
  article: "lagon",
  event: "tiare",
  annonce: "soleil",
  restaurant: "couchant",
  activite: "tipanier",
  info: "ocean",
} as const;

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const results = query ? await searchAll(query) : [];

  return (
    <>
      <PageHeader
        badge="Recherche"
        title={query ? `« ${query} »` : "Que cherchez-vous ?"}
        description={
          query
            ? `${results.length} résultat${results.length > 1 ? "s" : ""} trouvé${
                results.length > 1 ? "s" : ""
              }`
            : "Tapez votre recherche dans la barre ci-dessous"
        }
        variant="lagon"
      />
      <Container className="py-10 sm:py-12">
        <SearchBar variant="inline" />
      </Container>

      <Container className="pb-16">
        {query && results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 inline-block animate-wave">🏝️</div>
            <p className="text-ocean-700">
              Aucun résultat pour <strong>« {query} »</strong>
            </p>
            <p className="mt-2 text-sm text-ocean-500">
              Essayez avec un mot-clé plus court ou une autre orthographe.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {results.map((r, i) => (
              <li key={i}>
                <Link
                  href={r.href}
                  className="block bg-white rounded-2xl border border-ocean-100 p-5 hover:border-tiare-300 hover:shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <Badge variant={BADGE_VARIANTS[r.type]}>{r.badge}</Badge>
                      <h3 className="mt-2 font-display text-lg text-ocean-900">
                        {r.title}
                      </h3>
                      <p className="mt-1 text-sm text-ocean-600 line-clamp-2">
                        {r.excerpt}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="text-ocean-400 flex-shrink-0 mt-1"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {!query && (
          <div className="rounded-3xl bg-gradient-to-br from-lagon-50 to-tiare-50 p-8 text-center">
            <Search size={42} className="mx-auto text-lagon-500 mb-3" />
            <h2 className="font-display text-xl text-ocean-900">
              Recherchez dans tout le contenu
            </h2>
            <p className="mt-2 text-ocean-700 max-w-md mx-auto">
              Articles, événements, annonces, restaurants, activités, infos
              pratiques — tout est indexé.
            </p>
          </div>
        )}
      </Container>
    </>
  );
}
