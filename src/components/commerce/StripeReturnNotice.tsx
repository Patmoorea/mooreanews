"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Notice() {
  const params = useSearchParams();
  const premium = params.get("premium");
  const accommodation = params.get("accommodation_premium");

  return (
    <>
      {premium === "success" && (
        <p className="mt-4 rounded-2xl bg-tipanier-50 border border-tipanier-200 p-4 text-sm text-tipanier-800">
          Paiement reçu — votre fiche restaurant premium sera activée sous quelques minutes.
        </p>
      )}
      {accommodation === "success" && (
        <p className="mt-4 rounded-2xl bg-soleil-50 border border-soleil-200 p-4 text-sm text-soleil-800">
          Paiement reçu — votre hébergement sera mis à la une visiteurs sous quelques minutes.
        </p>
      )}
    </>
  );
}

/** Retour Stripe `?premium=` : lu dans le navigateur, la page reste en cache. */
export function StripeReturnNotice() {
  return (
    <Suspense fallback={null}>
      <Notice />
    </Suspense>
  );
}
