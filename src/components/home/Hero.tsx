import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";
import { WaveDivider, TROPICAL_EMOJI } from "@/components/decor/TropicalDecor";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-lagon-100/90 via-soleil-50/50 to-sable-100">
      <div
        aria-hidden
        className="absolute inset-0 bg-palm-pattern opacity-80 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-tapa opacity-40 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute top-10 -right-16 w-80 h-80 bg-soleil-300/30 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-10 -left-20 w-96 h-96 bg-lagon-300/25 rounded-full blur-3xl pointer-events-none"
      />

      <Container className="relative py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur border border-lagon-200/80 text-xs uppercase tracking-widest text-ocean-700 font-medium shadow-sm">
              <span aria-hidden>{TROPICAL_EMOJI.welcome}</span>
              Ia ora na — bienvenue sur MooreaNews
              <span aria-hidden>{TROPICAL_EMOJI.palm}</span>
            </div>

            <h1 className="mt-6 font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-balance leading-[1.1] text-ocean-950">
              L&apos;info de Moorea en{" "}
              <span className="bg-gradient-to-r from-lagon-600 via-tipanier-500 to-tiare-500 bg-clip-text text-transparent">
                Polynésie française
              </span>{" "}
              <span aria-hidden className="inline-block not-italic">
                {TROPICAL_EMOJI.island}
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-ocean-700 max-w-2xl mx-auto lg:mx-0 text-pretty">
              {SITE.heroLead}
            </p>

            <p className="mt-3 text-sm italic text-tiare-600 flex items-center justify-center lg:justify-start gap-2">
              <span aria-hidden>{TROPICAL_EMOJI.shell}</span>
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
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-ocean-800 font-semibold border-2 border-ocean-200 hover:border-tiare-400 hover:text-tiare-600 transition-colors shadow-sm"
              >
                <MapPin size={18} />
                Publier une info
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-md mx-auto lg:mx-0">
              <Stat emoji={TROPICAL_EMOJI.palm} number="100%" label="Local" />
              <Stat emoji={TROPICAL_EMOJI.wave} number="Live" label="Temps réel" />
              <Stat emoji={TROPICAL_EMOJI.sun} number="Gratuit" label="Pour tous" />
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 bg-gradient-to-br from-lagon-300/30 via-soleil-200/20 to-tiare-200/30 rounded-[3.5rem] blur-xl"
            />
            <div className="relative aspect-square rounded-[3rem] bg-gradient-to-br from-lagon-400 via-tipanier-400 to-tiare-400 p-1 shadow-[var(--shadow-tropical)] max-w-md mx-auto lg:mx-0">
              <div className="w-full h-full rounded-[2.8rem] bg-white/95 backdrop-blur p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-hibiscus opacity-60" />
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
                          className="px-2.5 py-1 rounded-full bg-lagon-100/90 text-ocean-700 font-medium border border-lagon-200/50"
                        >
                          {d}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="mt-4 font-display italic text-sm text-tiare-600">
                    E Māuruuru ia &apos;u {TROPICAL_EMOJI.welcome}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <WaveDivider className="text-lagon-200 relative -mb-px" />
    </section>
  );
}

function Stat({
  emoji,
  number,
  label,
}: {
  emoji: string;
  number: string;
  label: string;
}) {
  return (
    <div className="text-center sm:text-left rounded-2xl bg-white/70 backdrop-blur border border-lagon-100/80 px-3 py-3 shadow-sm">
      <div className="text-lg mb-0.5" aria-hidden>
        {emoji}
      </div>
      <div className="font-display text-xl sm:text-2xl text-ocean-900">
        {number}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-ocean-600">
        {label}
      </div>
    </div>
  );
}
