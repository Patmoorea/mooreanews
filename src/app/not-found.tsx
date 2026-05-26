import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Home, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ocean-100 via-lagon-50 to-white min-h-[70vh] flex items-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-tapa opacity-40 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-96 h-96 bg-tiare-300/30 rounded-full blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -right-24 w-96 h-96 bg-soleil-300/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <Container className="relative text-center py-20">
        <div className="text-8xl sm:text-9xl mb-6 animate-wave inline-block">
          🌴
        </div>
        <h1 className="font-display text-5xl sm:text-7xl text-ocean-950">
          404
        </h1>
        <p className="mt-4 font-display text-2xl sm:text-3xl text-ocean-700">
          Cette page s&apos;est perdue dans le lagon
        </p>
        <p className="mt-3 text-ocean-600 max-w-md mx-auto">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
          Retournons sur la plage principale.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform"
          >
            <Home size={18} />
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-ocean-800 font-semibold border-2 border-ocean-200 hover:border-tiare-400 hover:text-tiare-600 transition-colors"
          >
            <Compass size={18} />
            Voir les actus
          </Link>
        </div>
      </Container>
    </section>
  );
}
