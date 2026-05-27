import { Container } from "@/components/ui/Container";
import { WeatherCard } from "@/components/widgets/WeatherCard";
import { FerryCard } from "@/components/widgets/FerryCard";
import { SunMoonCard } from "@/components/widgets/SunMoonCard";
import { TidesCard } from "@/components/widgets/TidesCard";
import { ForecastStrip } from "@/components/widgets/ForecastStrip";
import { TropicalSection, TROPICAL_EMOJI } from "@/components/decor/TropicalDecor";

export function LiveDashboard() {
  return (
    <TropicalSection className="py-16 sm:py-20" warm>
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-tipanier-200 text-tipanier-800 text-xs font-semibold uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tipanier-500 animate-pulse-glow" />
            <span aria-hidden>{TROPICAL_EMOJI.wave}</span>
            Données en direct
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl text-ocean-950">
            Moorea en temps réel {TROPICAL_EMOJI.sun}
          </h2>
          <p className="mt-3 text-ocean-700">
            Météo, ferries, marées, lever/coucher du soleil et phase de la
            lune — mis à jour automatiquement.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <WeatherCard />
          <SunMoonCard />
          <TidesCard />
          <div className="sm:col-span-2 lg:col-span-1">
            <FerryCard />
          </div>
        </div>

        <div className="mt-6">
          <ForecastStrip />
        </div>
      </Container>
    </TropicalSection>
  );
}
