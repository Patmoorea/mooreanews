"use client";

import dynamic from "next/dynamic";
import { Container } from "@/components/ui/Container";

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
  }
);

export function InteractiveMap() {
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
            Restaurants, activités, plages, transports, infos pratiques —
            filtrez et explorez l&apos;île d&apos;un coup d&apos;œil.
          </p>
        </div>

        <MooreaMap />
      </Container>
    </section>
  );
}
