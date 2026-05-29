"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { unpublishLegacyFacebookImports } from "@/app/admin/actions";

export function CleanupFacebookImportsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onClick() {
    if (
      !confirm(
        "Dépublier les actualités importées de Facebook datant de 2021–2022 (et masquer les doublons « veille externe ») ?",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { unpublished } = await unpublishLegacyFacebookImports();
      setMessage(
        unpublished > 0
          ? `${unpublished} article(s) passé(s) en brouillon. Rechargez le site public.`
          : "Aucun article ancien à corriger (déjà en brouillon ou introuvable).",
      );
      router.refresh();
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Échec du nettoyage. Réessayez.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-tiare-200 bg-tiare-50/60 p-4">
      <p className="text-sm text-ocean-800">
        Des posts Facebook de 2021–2022 ont pu être importés comme « récents ».
        Utilisez ce bouton pour les retirer du site (brouillon + veille externe).
      </p>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-3 px-4 py-2 rounded-xl bg-tiare-600 text-white text-sm font-semibold hover:bg-tiare-700 disabled:opacity-60"
      >
        {busy ? "Nettoyage…" : "Retirer les imports Facebook obsolètes"}
      </button>
      {message && (
        <p className="mt-2 text-sm text-ocean-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
