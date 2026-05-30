import { TouristMapClient } from "@/components/visiteurs/TouristMapClient";
import type { TouristMapMarker } from "@/lib/tourist-map-markers";

export function TouristMapSection({
  markers,
}: {
  markers: TouristMapMarker[];
}) {
  return (
    <section>
      <h2 className="font-display text-xl text-ocean-950 mb-2">
        Carte touriste
      </h2>
      <p className="text-sm text-ocean-600 mb-4">
        Plages (score lagon), restaurants et événements à venir — filtres par
        catégorie et quartier.
      </p>
      <TouristMapClient markers={markers} />
    </section>
  );
}
