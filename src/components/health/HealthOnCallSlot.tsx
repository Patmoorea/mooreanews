import { getHealthOnCall } from "@/lib/health-on-call";
import { HealthOnCallPanel } from "@/components/health/HealthOnCallPanel";

/** Bannière accueil — visible week-end et jours fériés. */
export async function HealthOnCallSlot() {
  const data = await getHealthOnCall();
  if (!data.showProminent) return null;

  return (
    <section
      id="sante-garde-accueil"
      className="py-6 sm:py-8 bg-gradient-to-b from-tiare-50/80 to-white scroll-mt-36 md:scroll-mt-44"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <HealthOnCallPanel data={data} variant="banner" />
      </div>
    </section>
  );
}
