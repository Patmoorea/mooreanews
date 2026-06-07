import { Container } from "@/components/ui/Container";
import { WeatherCard } from "@/components/widgets/WeatherCard";
import { FerryCard } from "@/components/widgets/FerryCard";
import { CruiseShipsCard } from "@/components/widgets/CruiseShipsCard";
import { UtilityOutagesCard } from "@/components/widgets/UtilityOutagesCard";
import { MaritimeTrafficCard } from "@/components/widgets/MaritimeTrafficCard";
import { SunMoonCard } from "@/components/widgets/SunMoonCard";
import { TidesCard } from "@/components/widgets/TidesCard";
import { ForecastStrip } from "@/components/widgets/ForecastStrip";
import { BeachSwimScores } from "@/components/widgets/BeachSwimScores";
import { MeteoVigilanceCard } from "@/components/widgets/MeteoVigilanceCard";
import { TropicalSection, TROPICAL_EMOJI } from "@/components/decor/TropicalDecor";
import { RaiTahitiSpotlight } from "@/components/RaiTahitiSpotlight";
import { HealthOnCallCompact } from "@/components/health/HealthOnCallCompact";

export function LiveDashboard() {
  return (
    <TropicalSection
      id="en-direct"
      className="py-12 sm:py-16 scroll-mt-36 md:scroll-mt-44"
      warm
    >
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-tipanier-200 text-tipanier-800 text-xs font-semibold uppercase tracking-widest shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tipanier-500 animate-pulse-glow" />
            <span aria-hidden>{TROPICAL_EMOJI.wave}</span>
            Outils du quotidien
          </span>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl text-ocean-950">
            Météo, ferries & marées {TROPICAL_EMOJI.sun}
          </h2>
          <p className="mt-3 text-ocean-700 text-sm sm:text-base">
            Données en direct — après l&apos;actualité et l&apos;agenda de
            l&apos;île.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <WeatherCard />
          <SunMoonCard />
          <TidesCard />
          <div className="sm:col-span-2 lg:col-span-1">
            <FerryCard />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <CruiseShipsCard />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <UtilityOutagesCard />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <MaritimeTrafficCard />
          </div>
        </div>

        <div className="mt-6">
          <ForecastStrip />
        </div>

        <div className="mt-6 grid gap-5 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <MeteoVigilanceCard />
          <BeachSwimScores />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
          <HealthOnCallCompact />
          <RaiTahitiSpotlight variant="compact" />
        </div>
      </Container>
    </TropicalSection>
  );
}
