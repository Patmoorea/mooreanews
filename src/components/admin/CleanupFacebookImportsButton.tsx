"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLegacyFacebookImports } from "@/app/admin/actions";

type Props = {
  staleCount: number;
};

export function CleanupFacebookImportsButton({ staleCount }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    if (
      !confirm(
        `Supprimer définitivement ${staleCount} actualité(s) Facebook obsolète(s) ?\n\nElles disparaîtront de l'admin ET du site public. Action irréversible.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { deleted } = await deleteLegacyFacebookImports();
      setMessage(
        deleted > 0
          ? `${deleted} article(s) supprimé(s). Rechargez mooreanews.com (Cmd+Shift+R).`
          : "Nettoyage terminé.",
      );
      router.refresh();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Échec de la suppression. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-tiare-300 bg-tiare-50 p-4">
      <p className="text-sm text-ocean-900 font-medium">
        {staleCount} import{staleCount > 1 ? "s" : ""} Facebook obsolète
        {staleCount > 1 ? "s" : ""} détecté{staleCount > 1 ? "s" : ""} (2021–2022
        ou dates passées)
      </p>
      <p className="mt-1 text-sm text-ocean-700">
        Ce bouton les <strong>supprime définitivement</strong> (admin + site public
        + veille externe). Pour un seul article, utilisez{" "}
        <strong>Supprimer</strong> à droite du tableau.
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-3 px-4 py-2 rounded-xl bg-tiare-600 text-white text-sm font-semibold hover:bg-tiare-700 disabled:opacity-60"
      >
        {busy
          ? "Suppression…"
          : `Supprimer ${staleCount} import${staleCount > 1 ? "s" : ""} obsolète${staleCount > 1 ? "s" : ""}`}
      </button>
      {message && (
        <p className="mt-2 text-sm text-ocean-800 font-medium" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
