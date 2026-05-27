import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ocean-50 via-lagon-50 to-white">
      {/* Décor doux derrière la bannière */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none bg-tapa opacity-50"
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-96 h-96 bg-soleil-300/30 rounded-full blur-3xl animate-float"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-24 w-[28rem] h-[28rem] bg-lagon-300/30 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
      />

      <Container className="relative pt-12 pb-16 sm:pt-16 sm:pb-20">
        {/* Bannière vedette */}
        <div className="relative rounded-3xl overflow-hidden shadow-[var(--shadow-tropical)] ring-1 ring-ocean-100">
          <Image
            src={SITE.banner}
            alt={`${SITE.name} — ${SITE.tagline}`}
            width={1280}
            height={478}
            priority
            sizes="(max-width:1024px) 100vw, 1100px"
            className="w-full h-auto block"
          />
          {/* Effet subtil de bordure intérieure pour lier au site */}
          <div
            aria-hidden
            className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-3xl pointer-events-none"
          />
        </div>

        {/* CTA + stats sous la bannière */}
        <div className="mt-10 sm:mt-12 grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-lagon-200 text-xs uppercase tracking-widest text-ocean-700 font-medium shadow-sm">
              <Sparkles size={14} className="text-tiare-500" />
              Ia ora na — bienvenue sur MooreaNews
            </div>

            <h1 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl text-balance leading-[1.15] text-ocean-950">
              Tout ce qui fait vivre Moorea,{" "}
              <span className="bg-gradient-to-r from-lagon-600 via-tipanier-500 to-tiare-500 bg-clip-text text-transparent">
                en un seul endroit.
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-ocean-700 max-w-2xl mx-auto lg:mx-0 text-pretty">
              Actualités locales, vie locale & société, tourisme & loisirs,
              événements & culture, infos pratiques. Météo, ferries et marées
              en temps réel, mis à jour automatiquement chaque heure.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
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

            <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto lg:mx-0">
              <Stat number="100%" label="Local" />
              <Stat number="Live" label="Temps réel" />
              <Stat number="Gratuit" label="Pour tous" />
            </div>
          </div>

          {/* Mini-carte d'identité de l'île */}
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-tropical p-1 shadow-[var(--shadow-tropical)] animate-float">
              <div className="w-full h-full rounded-[2.8rem] bg-white/95 backdrop-blur p-7 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-tapa opacity-30" />
                <div className="relative">
                  <Image
                    src={SITE.logo}
                    alt={SITE.name}
                    width={84}
                    height={84}
                    className="mx-auto mb-3 drop-shadow-md"
                  />
                  <h2 className="font-display text-2xl text-ocean-900">
                    Moorea
                  </h2>
                  <p className="mt-1 text-xs text-ocean-600">
                    17°32′ S · 149°50′ O
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
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
