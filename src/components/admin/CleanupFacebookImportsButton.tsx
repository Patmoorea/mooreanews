"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLegacyFacebookImports } from "@/app/admin/actions";

type Props = {
  count: number;
};

export function CleanupFacebookImportsButton({ count: initialCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(initialCount);

  if (remaining <= 0) return null;

  async function onClick() {
    if (
      !confirm(
        `Supprimer ${remaining} import(s) Facebook vide(s) ou obsolète(s) ?\n\nIls disparaîtront de l'admin ET du site public. Action irréversible.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const { deleted } = await deleteLegacyFacebookImports();
      setRemaining(Math.max(0, remaining - deleted));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-tiare-300 bg-tiare-50 p-4">
      <p className="text-sm text-ocean-900 font-medium">
        {remaining} publication{remaining > 1 ? "s" : ""} Facebook inutile
        {remaining > 1 ? "s" : ""} détectée{remaining > 1 ? "s" : ""}
      </p>
      <p className="mt-1 text-sm text-ocean-700">
        Coquilles sans texte ni affiche, posts trop anciens, ou événements Facebook
        avec date recalée (ex. « ce vendredi » d&apos;un post 2022).
        Le cron horaire tente de les supprimer automatiquement ; ce bandeau
        réapparaît tant qu&apos;il en reste en base.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-3 px-4 py-2 rounded-xl bg-tiare-600 text-white text-sm font-semibold hover:bg-tiare-700 disabled:opacity-60"
      >
        {busy
          ? "Suppression…"
          : `Nettoyer ${remaining} import${remaining > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
