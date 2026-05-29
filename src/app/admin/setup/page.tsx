import { CheckCircle2, XCircle, Wrench } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getProductionSetupStatus } from "@/lib/setup-status";

export const metadata = { title: "Configuration production" };

export default async function AdminSetupPage() {
  const checks = await getProductionSetupStatus();
  const okCount = checks.filter((c) => c.ok).length;

  return (
    <div>
      <AdminPageHeader
        title="Configuration production"
        description={`${okCount}/${checks.length} éléments OK — SQL Supabase + variables Vercel`}
      />

      <div className="mb-6 rounded-2xl border border-lagon-200 bg-lagon-50 p-5 text-sm text-ocean-800">
        <p className="font-semibold flex items-center gap-2">
          <Wrench size={16} />
          Action unique Supabase
        </p>
        <p className="mt-2">
          Collez et exécutez{" "}
          <code className="bg-white px-1 rounded">supabase/prod-setup-all.sql</code>{" "}
          dans l&apos;éditeur SQL Supabase.
        </p>
        <p className="mt-2 text-xs text-ocean-600">
          Vercel : RESEND_API_KEY, VAPID_*, CRON_SECRET, STRIPE_*, WORLD_TIDES_API_KEY
          — voir <code>docs/VAPID-VERCEL.md</code>
        </p>
      </div>

      <ul className="space-y-3">
        {checks.map((c) => (
          <li
            key={c.id}
            className={`rounded-2xl border p-4 flex gap-3 ${
              c.ok
                ? "border-tipanier-200 bg-tipanier-50/50"
                : "border-amber-200 bg-amber-50/50"
            }`}
          >
            {c.ok ? (
              <CheckCircle2 size={20} className="text-tipanier-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-ocean-900">{c.label}</p>
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
