"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteDuplicateArticles } from "@/app/admin/actions";

type Props = {
  count: number;
};

export function CleanupDuplicateArticlesButton({ count: initialCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState(initialCount);

  if (remaining <= 0) return null;

  async function onClick() {
    if (
      !confirm(
        `Supprimer ${remaining} actualité${remaining > 1 ? "s" : ""} en double ?\n\nLa fiche la plus complète est conservée pour chaque publication Facebook. Action irréversible.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const { deleted } = await deleteDuplicateArticles();
      setRemaining(Math.max(0, remaining - deleted));
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-soleil-300 bg-soleil-50 p-4">
      <p className="text-sm text-ocean-900 font-medium">
        {remaining} doublon{remaining > 1 ? "s" : ""} détecté
        {remaining > 1 ? "s" : ""} sur /actualites
      </p>
      <p className="mt-1 text-sm text-ocean-700">
        Même publication Facebook importée plusieurs fois (posts / feed Meta).
        Le nettoyage garde l&apos;article le plus complet (affiche, texte) et
        supprime les copies. Le cron horaire tente aussi de les retirer
        automatiquement.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-3 px-4 py-2 rounded-xl bg-ocean-900 text-white text-sm font-semibold hover:bg-ocean-800 disabled:opacity-60"
      >
        {busy
          ? "Suppression…"
          : `Supprimer ${remaining} doublon${remaining > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}
