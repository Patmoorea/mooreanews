import { Mail, Download } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { formatDateFR } from "@/lib/utils";

export const metadata = { title: "Newsletter" };

export default async function AdminNewsletterPage() {
  const supabase = await getServerSupabase();
  const { data: subs } =
    (await supabase
      ?.from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false })) ?? { data: [] };

  const confirmedCount = (subs ?? []).filter((s) => s.confirmed).length;
  const csvHref = `/api/admin/newsletter/export`;

  return (
    <div>
      <AdminPageHeader
        title="Newsletter"
        description={`${confirmedCount} abonné${confirmedCount > 1 ? "s" : ""} confirmé${confirmedCount > 1 ? "s" : ""} sur ${subs?.length ?? 0}`}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <a
          href={csvHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-ocean-200 text-sm text-ocean-800 hover:border-tiare-400"
        >
          <Download size={14} />
          Exporter CSV
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Inscrit</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Source</th>
              <th className="px-4 py-3 text-center">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(subs ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3 flex items-center gap-2 text-ocean-900">
                  <Mail size={12} className="text-ocean-400" />
                  <a
                    href={`mailto:${s.email}`}
                    className="hover:text-tiare-600"
                  >
                    {s.email}
                  </a>
                </td>
                <td className="px-4 py-3 text-ocean-600 hidden md:table-cell">
                  {formatDateFR(s.created_at)}
                </td>
                <td className="px-4 py-3 text-ocean-600 hidden lg:table-cell">
                  {s.source ?? "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.unsubscribed_at ? (
                    <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 text-xs">
                      Désinscrit
                    </span>
                  ) : s.confirmed ? (
                    <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs">
                      Confirmé
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-soleil-100 text-soleil-700 text-xs">
                      En attente
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {(subs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-ocean-500">
                  Aucun abonné pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
