"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "@/lib/map-locations";

const MooreaMap = dynamic(
  () => import("@/components/widgets/MooreaMap").then((m) => m.MooreaMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-3xl border border-ocean-100 h-[480px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-wave inline-block">🗺️</div>
          <p className="text-ocean-600">Chargement de la carte…</p>
        </div>
      </div>
    ),
  },
);

type Props = {
  markers: MapMarker[];
};

export function InteractiveMapClient({ markers }: Props) {
  return <MooreaMap markers={markers} />;
}
