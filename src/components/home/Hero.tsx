import Image from "next/image";
import Link from "next/link";
import {
  Newspaper,
  Megaphone,
  Calendar,
  Siren,
  CloudSun,
  Ship,
  ArrowRight,
  Plus,
  Smartphone,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";
import { WaveDivider, TROPICAL_EMOJI } from "@/components/decor/TropicalDecor";
import { HeroWeatherPill } from "@/components/home/HeroWeatherPill";
import { OutageSticker } from "@/components/home/OutageSticker";
import { EmploymentSticker } from "@/components/home/EmploymentSticker";
import { GardeWeekendSticker } from "@/components/home/GardeWeekendSticker";
import { WeeklyRecapSticker } from "@/components/home/WeeklyRecapSticker";
import { cn } from "@/lib/utils";

const UTILITIES: {
  href: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  {
    href: "/actualites",
    label: "Actualités",
    sub: "Dernières infos",
    icon: Newspaper,
    accent: "from-lagon-400/30 to-lagon-600/20",
  },
  {
    href: "/annonces",
    label: "Annonces",
    sub: "Petites annonces",
    icon: Megaphone,
    accent: "from-soleil-400/30 to-soleil-600/20",
  },
  {
    href: "/evenements",
    label: "Agenda",
    sub: "Événements",
    icon: Calendar,
    accent: "from-tiare-400/30 to-tiare-600/20",
  },
  {
    href: "/alertes",
    label: "Alertes",
    sub: "Temps réel",
    icon: Siren,
    accent: "from-couchant/40 to-tiare-600/25",
  },
  {
    href: "/#en-direct",
    label: "Météo",
    sub: "Vent · houle",
    icon: CloudSun,
    accent: "from-ocean-400/30 to-lagon-500/20",
  },
  {
    href: "/#en-direct",
    label: "Ferry",
    sub: "Prochains départs",
    icon: Ship,
    accent: "from-lagon-300/25 to-ocean-600/25",
  },
  {
    href: "/telecharger",
    label: "App",
    sub: "Android gratuit",
    icon: Smartphone,
    accent: "from-ocean-500/30 to-lagon-400/20",
  },
  {
    href: "/sante-garde",
    label: "Garde",
    sub: "WE & fériés",
    icon: Stethoscope,
    accent: "from-tiare-400/30 to-tiare-600/25",
  },
];

export function Hero() {
  return (
    <section className="relative flex flex-col justify-center overflow-hidden">
      {/* Fond immersif */}
      <Image
        src={SITE.navBanner}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center scale-105"
        aria-hidden
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#083B66]/85 via-[#083B66]/55 to-[#083B66]/92"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-lagon-500/15 via-transparent to-soleil-400/10"
      />
      <div
        aria-hidden
        className="absolute top-0 right-0 w-[min(100%,520px)] h-full opacity-20 bg-[radial-gradient(circle_at_70%_30%,#00C2D7_0%,transparent_55%)]"
      />

      <Container className="relative z-10 py-10 sm:py-14 lg:py-16">
        <div className="max-w-6xl mx-auto lg:grid lg:grid-cols-[1fr_auto] lg:gap-10 lg:items-center">
          {/* Carte glass principale */}
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-[0_24px_80px_-20px_rgba(8,59,102,0.65)] p-6 sm:p-10">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs uppercase tracking-widest font-semibold">
                  <span aria-hidden>{TROPICAL_EMOJI.welcome}</span>
                  Ia ora na
                </span>
                <HeroWeatherPill />
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
                <OutageSticker />
                <GardeWeekendSticker />
                <WeeklyRecapSticker />
                <EmploymentSticker />
              </div>
            </div>

            <h1 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl text-center lg:text-left text-balance leading-[1.08] text-white drop-shadow-sm">
              <span className="block text-white/90 text-lg sm:text-xl font-sans font-medium tracking-wide mb-2">
                {SITE.name}
              </span>
              Toute l&apos;actualité de Moorea{" "}
              <span className="bg-gradient-to-r from-[#00C2D7] via-lagon-300 to-soleil-300 bg-clip-text text-transparent">
                en temps réel
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/85 text-center lg:text-left max-w-2xl mx-auto lg:mx-0 text-pretty">
              {SITE.heroLead}
            </p>

            {/* Boutons utilitaires */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {UTILITIES.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "group relative flex flex-col justify-between min-h-[5.5rem] sm:min-h-[6.25rem] p-4 rounded-2xl",
                      "border border-white/25 bg-white/12 backdrop-blur-md",
                      "hover:bg-white/22 hover:border-white/40 hover:-translate-y-0.5",
                      "transition-all duration-200 shadow-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C2D7] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    )}
                  >
                    <div
                      aria-hidden
                      className={cn(
                        "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-60",
                        item.accent,
                      )}
                    />
                    <div className="relative flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                        <Icon size={22} strokeWidth={2} />
                      </span>
                      <ArrowRight
                        size={16}
                        className="text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                      />
                    </div>
                    <div className="relative mt-3">
                      <span className="block font-semibold text-white text-sm sm:text-base leading-tight">
                        {item.label}
                      </span>
                      <span className="block text-[11px] sm:text-xs text-white/70 mt-0.5">
                        {item.sub}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Actions principales */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <Link
                href="#infos-locales"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-br from-[#00C2D7] to-lagon-600 text-white font-semibold text-base shadow-[var(--shadow-tropical)] hover:-translate-y-0.5 transition-transform"
              >
                Lire l&apos;info de l&apos;île
                <ArrowRight size={20} />
              </Link>
              <Link
                href="/soumettre"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 text-white font-semibold text-base hover:bg-white/25 transition-colors"
              >
                <Plus size={20} />
                Publier une info
              </Link>
            </div>

          </div>

          <div className="hidden lg:flex items-center justify-center">
            <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-6 shadow-xl shrink-0">
              <Image
                src={SITE.logo}
                alt={SITE.name}
                width={120}
                height={120}
                className="drop-shadow-lg"
              />
              <p className="mt-3 text-center font-display text-lg text-white/90">
                Moorea
              </p>
              <p className="text-center text-[10px] text-white/60 tracking-wide">
                17°32′ S · 149°50′ O
              </p>
            </div>
          </div>
        </div>
      </Container>

      <WaveDivider className="text-lagon-200/80 relative -mb-px z-10" />
    </section>
  );
}
