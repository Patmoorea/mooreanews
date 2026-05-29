import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { COORDS_MIGRATION_HINT } from "@/lib/supabase/info-pratiques-db";

type Props = {
  warning?: string;
};

export function InfoCoordsBanner({ warning }: Props) {
  if (warning === "coords_schema") {
    return (
      <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-semibold flex items-center gap-2">
          <AlertTriangle size={16} />
          Coordonnées GPS non enregistrées
        </p>
        <p className="mt-2 text-amber-900">
          Supabase n&apos;a pas encore les colonnes <code>lat</code> /{" "}
          <code>lon</code>. Vos valeurs ont été ignorées à l&apos;enregistrement.
        </p>
        <p className="mt-2 text-amber-800">{COORDS_MIGRATION_HINT}</p>
        <p className="mt-2">
          Fichier :{" "}
          <code className="rounded bg-amber-100 px-1">
            supabase/info-pratiques-coords.sql
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-lagon-200 bg-lagon-50/80 p-4 text-sm text-ocean-800">
      <p className="font-semibold text-ocean-900">Carte interactive</p>
      <p className="mt-1">
        Renseignez latitude + longitude puis <strong>publiez</strong>. Le point
        apparaît sur l&apos;accueil (filtre « Infos »). Logo optionnel ci-dessous.
      </p>
      <p className="mt-2 text-xs text-ocean-600">
        Si la carte reste vide après enregistrement, exécutez le SQL{" "}
        <Link href="/admin/info" className="underline font-medium">
          info-pratiques-coords.sql
        </Link>{" "}
        dans Supabase.
      </p>
    </div>
  );
}
