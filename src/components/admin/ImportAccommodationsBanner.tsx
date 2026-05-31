"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Check, AlertCircle, Database } from "lucide-react";
import { importAccommodationsFromCatalog } from "@/app/admin/actions";
import { ACCOMMODATIONS_TABLE_HINT } from "@/lib/supabase/schema-errors";

type Props = {
  missingNames: string[];
  tableMissing?: boolean;
};

export function ImportAccommodationsBanner({
  missingNames,
  tableMissing = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  if (!tableMissing && missingNames.length === 0 && !message) return null;

  async function onImport() {
    setLoading(true);
    setMessage(null);
    setError(false);
    try {
      const result = await importAccommodationsFromCatalog();
      if (result.error) {
        setError(true);
        setMessage(result.error);
      } else if (result.imported.length === 0) {
        setMessage("Tous les hébergements du catalogue sont déjà en base.");
      } else {
        setMessage(
          `${result.imported.length} hébergement(s) importé(s) : ${result.imported.join(", ")}`,
        );
        router.refresh();
      }
    } catch {
      setError(true);
      setMessage(ACCOMMODATIONS_TABLE_HINT);
    } finally {
      setLoading(false);
    }
  }

  if (tableMissing) {
    return (
      <div className="mb-6 rounded-2xl border border-tiare-300 bg-tiare-50 p-5">
        <p className="font-semibold text-ocean-900 flex items-center gap-2">
          <Database size={18} className="text-tiare-600 shrink-0" />
          Table Supabase manquante
        </p>
        <p className="mt-2 text-sm text-ocean-800">{ACCOMMODATIONS_TABLE_HINT}</p>
        <ol className="mt-3 text-sm text-ocean-700 list-decimal list-inside space-y-1">
          <li>
            Ouvrir{" "}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lagon-700 underline font-medium"
            >
              Supabase → SQL Editor
            </a>
          </li>
          <li>
            Coller le contenu de{" "}
            <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-ocean-200">
              supabase/accommodations.sql
            </code>{" "}
            (ou ré-exécuter{" "}
            <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-ocean-200">
              supabase/prod-setup-all.sql
            </code>
            )
          </li>
          <li>Cliquer Run → recharger cette page → « Importer dans Supabase »</li>
        </ol>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-lagon-200 bg-lagon-50 p-5">
      <p className="font-semibold text-ocean-900">
        {missingNames.length > 0
          ? `${missingNames.length} hébergement(s) du catalogue à importer`
          : "Import terminé"}
      </p>
      {missingNames.length > 0 && (
        <>
          <p className="mt-1 text-sm text-ocean-700">
            {missingNames.slice(0, 8).join(" · ")}
            {missingNames.length > 8 ? "…" : ""}
          </p>
          <button
            type="button"
            onClick={onImport}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white text-sm font-semibold disabled:opacity-60"
          >
            {loading ? (
              "Import…"
            ) : (
              <>
                <Download size={16} />
                Importer dans Supabase
              </>
            )}
          </button>
        </>
      )}
      {message && (
        <p
          className={`mt-3 text-sm flex items-center gap-2 ${
            error ? "text-tiare-700" : "text-tipanier-700"
          }`}
        >
          {error ? <AlertCircle size={14} /> : <Check size={14} />}
          {message}
        </p>
      )}
    </div>
  );
}
