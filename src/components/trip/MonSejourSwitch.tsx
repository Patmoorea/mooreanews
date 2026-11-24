"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TripPlanClient } from "@/components/trip/TripPlanClient";
import type { TripPlan } from "@/lib/mon-sejour";

function SwitchBody({
  plans,
  duration,
}: {
  plans: { "48h": TripPlan; "7j": TripPlan };
  duration: "48h" | "7j";
}) {
  return (
    <>
      <div className="flex gap-2 mb-8">
        <Link
          href="/mon-sejour"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            duration === "48h"
              ? "bg-ocean-900 text-white"
              : "bg-ocean-50 text-ocean-800 border border-ocean-100"
          }`}
        >
          48 heures
        </Link>
        <Link
          href="/mon-sejour?duree=7j"
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            duration === "7j"
              ? "bg-ocean-900 text-white"
              : "bg-ocean-50 text-ocean-800 border border-ocean-100"
          }`}
        >
          7 jours
        </Link>
      </div>
      <TripPlanClient plan={plans[duration]} />
    </>
  );
}

function FromQuery({ plans }: { plans: { "48h": TripPlan; "7j": TripPlan } }) {
  const params = useSearchParams();
  const duration = params.get("duree") === "7j" ? "7j" : "48h";
  return <SwitchBody plans={plans} duration={duration} />;
}

export function MonSejourSwitch({
  plans,
}: {
  plans: { "48h": TripPlan; "7j": TripPlan };
}) {
  return (
    <Suspense fallback={<SwitchBody plans={plans} duration="48h" />}>
      <FromQuery plans={plans} />
    </Suspense>
  );
}
