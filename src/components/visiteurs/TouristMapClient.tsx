"use client";

import dynamic from "next/dynamic";
import type { TouristMapMarker } from "@/lib/tourist-map-markers";

const MooreaMap = dynamic(
  () => import("@/components/widgets/MooreaMap").then((m) => m.MooreaMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] rounded-3xl bg-ocean-100 animate-pulse flex items-center justify-center text-ocean-500 text-sm">
        Chargement de la carte…
      </div>
    ),
  },
);

export function TouristMapClient({
  markers,
}: {
  markers: TouristMapMarker[];
}) {
  return <MooreaMap markers={markers} />;
}
