import { Container } from "@/components/ui/Container";

/** Titre de zone — l’info locale est la priorité de l’accueil. */
export function HomeLocalIntro() {
  return (
    <div className="bg-white border-b border-ocean-100">
      <Container className="py-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-lagon-700">
          MooreaNews
        </p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ocean-950 text-balance">
          L&apos;info de l&apos;île — actualités, agenda & annonces
        </h2>
        <p className="mt-2 text-ocean-700 max-w-2xl text-pretty">
          Tout ce qui compte pour Moorea est ici en premier. Météo, ferries et
          marées restent accessibles plus bas ou via le menu « Météo & ferries ».
        </p>
      </Container>
    </div>
  );
}
