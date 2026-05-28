import { Container } from "@/components/ui/Container";
import { buildMapMarkers } from "@/lib/build-map-markers";
import { InteractiveMapClient } from "@/components/home/InteractiveMapClient";

export async function InteractiveMap() {
  const markers = await buildMapMarkers();
  const fromAdmin = markers.filter(
    (m) =>
      m.id.startsWith("restaurant-") ||
      m.id.startsWith("activity-") ||
      m.id.startsWith("info-"),
  ).length;

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-tipanier-100 text-tipanier-700 text-xs font-semibold uppercase tracking-widest">
            Explorer l&apos;île
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ocean-950">
            La carte interactive de Moorea
          </h2>
          <p className="mt-3 text-ocean-700">
            Ce que vous renseignez dans l&apos;admin (latitude / longitude)
            apparaît ici : restaurants, activités et infos pratiques.
          </p>
          {fromAdmin > 0 ? (
            <p className="mt-2 text-sm text-lagon-700 font-medium">
              {fromAdmin} lieu{fromAdmin > 1 ? "x" : ""} depuis l&apos;admin
              {markers.length > fromAdmin
                ? ` + ${markers.length - fromAdmin} repères fixes (ferries, plages…)`
                : ""}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ocean-600">
              Admin → Restaurants, Activités ou Infos pratiques : remplissez
              « Latitude » et « Longitude » (Google Maps).
            </p>
          )}
        </div>

        <InteractiveMapClient markers={markers} />
      </Container>
    </section>
  );
}
