import { CheckCircle2, Circle, XCircle, Wrench } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getProductionSetupStatus } from "@/lib/setup-status";

export const metadata = { title: "Configuration production" };

export default async function AdminSetupPage() {
  const checks = await getProductionSetupStatus();
  const required = checks.filter((c) => !c.optional);
  const requiredOk = required.filter((c) => c.ok).length;
  const optional = checks.filter((c) => c.optional);

  return (
    <div>
      <AdminPageHeader
        title="Configuration production"
        description={`${requiredOk}/${required.length} éléments requis OK${optional.length ? ` · ${optional.length} optionnel(s)` : ""}`}
      />

      <div className="mb-6 rounded-2xl border border-lagon-200 bg-lagon-50 p-5 text-sm text-ocean-800">
        <p className="font-semibold flex items-center gap-2">
          <Wrench size={16} />
          Pour tout mettre au vert (sauf marées payantes)
        </p>
        <ol className="mt-3 space-y-2 list-decimal list-inside text-ocean-700">
          <li>
            Supabase → SQL Editor → exécuter{" "}
            <code className="bg-white px-1 rounded">prod-setup-all.sql</code>
          </li>
          <li>
            Puis{" "}
            <code className="bg-white px-1 rounded">page-analytics-v2.sql</code>{" "}
            (stats appareils)
          </li>
          <li>
            Vercel → Settings → Environment Variables → ajouter les 3 clés{" "}
            <strong>Stripe</strong> → Redeploy
          </li>
          <li>
            Stripe Dashboard → Webhook →{" "}
            <code className="text-xs">/api/stripe/webhook</code>
          </li>
        </ol>
        <p className="mt-3 text-xs text-ocean-600">
          Marées WorldTides : <strong>pas nécessaire</strong> — le site utilise
          un calcul local gratuit.
        </p>
      </div>

      <ul className="space-y-3">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`rounded-2xl border p-4 flex gap-3 ${
              c.ok
                ? c.optional
                  ? "border-ocean-200 bg-ocean-50/40"
                  : "border-tipanier-200 bg-tipanier-50/50"
                : "border-amber-200 bg-amber-50/50"
            }`}
          >
            {c.ok ? (
              c.optional ? (
                <Circle size={20} className="text-ocean-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={20} className="text-tipanier-600 flex-shrink-0 mt-0.5" />
              )
            ) : (
              <XCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-ocean-900">
                {c.label}
                {c.optional ? (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-ocean-500 font-normal">
                    optionnel
                  </span>
                ) : null}
              </p>
              <p className="text-sm text-ocean-700 mt-0.5">{c.detail}</p>
              {c.action && !c.ok && (
                <p className="text-xs text-ocean-500 mt-1 font-mono">{c.action}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
