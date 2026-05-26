import { WeatherWidget } from "./widgets/WeatherWidget";
import { FerryWidget } from "./widgets/FerryWidget";
import { SunMoonWidget } from "./widgets/SunMoonWidget";
import { TideWidget } from "./widgets/TideWidget";

export function LiveWidgets() {
  return (
    <section className="relative -mt-16 lg:-mt-24 z-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <WeatherWidget />
          <FerryWidget />
          <SunMoonWidget />
          <TideWidget />
        </div>
      </div>
    </section>
  );
}
