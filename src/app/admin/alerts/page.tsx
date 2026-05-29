import Link from "next/link";
import { dbListAdminAlerts } from "@/lib/supabase/queries";
import { isAlertExpired, isAlertVisibleNow } from "@/lib/alert-schedule";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AlertRowActions } from "@/components/admin/AlertRowActions";
import { formatDateShortFR } from "@/lib/utils";

export const metadata = { title: "Alertes" };

const TYPE_LABEL: Record<string, string> = {
  coupure_eau: "🚰 Coupure d’eau",
  coupure_edt: "⚡ Coupure EDT",
  route: "🚧 Route / travaux",
  houle: "🌊 Houle",
  ferry: "⛴ Ferry",
  meteo: "⛅ Météo",
  autre: "ℹ️ Autre",
};

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-ocean-100 text-ocean-700",
  warning: "bg-soleil-100 text-soleil-800",
  alert: "bg-tiare-100 text-tiare-700",
};

export default async function AdminAlertsPage() {
  const rows = (await dbListAdminAlerts()) ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Alertes temps réel"
        description={`${rows.length} alerte${rows.length > 1 ? "s" : ""}`}
        newHref="/admin/alerts/new"
        newLabel="Nouvelle alerte"
      />

      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Alerte</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                Gravité
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                District
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">
                Fin
              </th>
              <th className="px-4 py-3 text-center">État</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/alerts/${r.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600"
                  >
                    {r.title}
                  </Link>
                  <div className="text-xs text-ocean-600 mt-1">
                    {TYPE_LABEL[r.type] ?? r.type}
                    {r.urgent ? " · BREAKING" : ""}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      SEVERITY_BADGE[r.severity] ?? SEVERITY_BADGE.info
                    }`}
                  >
                    {r.severity}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-700">
                  {r.district ?? "—"}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-600">
                  {r.ends_at ? formatDateShortFR(r.ends_at) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {isAlertVisibleNow(r) ? (
                    <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs">
                      En ligne
                    </span>
                  ) : r.active && isAlertExpired(r) ? (
                    <span className="px-2 py-0.5 rounded-full bg-soleil-100 text-soleil-800 text-xs">
                      Expirée
                    </span>
                  ) : r.active ? (
                    <span className="px-2 py-0.5 rounded-full bg-lagon-100 text-lagon-700 text-xs">
                      Programmée
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 text-xs">
                      Off
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AlertRowActions id={r.id} active={r.active} urgent={r.urgent} />
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-ocean-500">
                  Aucune alerte.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

