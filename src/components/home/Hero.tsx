import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ocean-50 via-lagon-50 to-white">
      {/* Décor doux */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-tapa opacity-50"
      />
      <div
        aria-hidden
        className="absolute top-20 -right-24 w-96 h-96 bg-soleil-300/30 rounded-full blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] bg-lagon-300/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        aria-hidden
        className="absolute top-40 left-1/3 w-72 h-72 bg-tipanier-200/30 rounded-full blur-3xl"
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
          {/* Colonne texte */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-lagon-200 text-xs uppercase tracking-widest text-ocean-700 font-medium shadow-sm">
              <Sparkles size={14} className="text-tiare-500" />
              Ia ora na — bienvenue sur MooreaNews
            </div>

            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-balance leading-[1.1] text-ocean-950">
              L&apos;info de Moorea et de la{" "}
              <span className="bg-gradient-to-r from-lagon-600 via-tipanier-500 to-tiare-500 bg-clip-text text-transparent">
                Polynésie française
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-ocean-700 max-w-2xl mx-auto lg:mx-0 text-pretty">
              Actualités locales, vie locale & société, tourisme & loisirs,
              événements & culture, infos pratiques. Météo, ferries et marées
              en temps réel.
            </p>

            <p className="mt-3 text-sm italic text-tiare-600">
              {SITE.motto}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                href="/actualites"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white font-semibold shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform"
              >
                Découvrir les actus
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/soumettre"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-ocean-800 font-semibold border-2 border-ocean-200 hover:border-tiare-400 hover:text-tiare-600 transition-colors"
              >
                <MapPin size={18} />
                Publier une info
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto lg:mx-0">
              <Stat number="100%" label="Local" />
              <Stat number="Live" label="Temps réel" />
              <Stat number="Gratuit" label="Pour tous" />
            </div>
          </div>

          {/* Colonne logo : carte d'identité de l'île */}
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-tropical p-1 shadow-[var(--shadow-tropical)] animate-float max-w-md mx-auto lg:mx-0">
              <div className="w-full h-full rounded-[2.8rem] bg-white/95 backdrop-blur p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-tapa opacity-30" />
                <div className="relative">
                  <Image
                    src={SITE.logo}
                    alt={SITE.name}
                    width={180}
                    height={180}
                    priority
                    className="mx-auto mb-3 drop-shadow-md"
                  />
                  <h2 className="font-display text-2xl text-ocean-900">
                    Moorea
                  </h2>
                  <p className="mt-1 text-xs text-ocean-600">
                    17°32′ S · 149°50′ O
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs max-w-xs mx-auto">
                    {["Maharepa", "Paopao", "Haapiti", "Afareaitu"].map(
                      (d) => (
                        <span
                          key={d}
                          className="px-2.5 py-1 rounded-full bg-lagon-100 text-ocean-700 font-medium"
                        >
                          {d}
                        </span>
                      )
                    )}
                  </div>
                  <p className="mt-4 font-display italic text-sm text-tiare-600">
                    E Māuruuru ia &apos;u
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="font-display text-2xl sm:text-3xl text-ocean-900">
        {number}
      </div>
      <div className="text-xs uppercase tracking-wider text-ocean-600">
        {label}
      </div>
    </div>
  );
}
