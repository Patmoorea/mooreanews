import Link from "next/link";
import { Siren } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";

export const metadata = { title: "Infos pratiques" };

export default async function AdminInfoPage() {
  const supabase = await getServerSupabase();
  const { data: rows } =
    (await supabase
      ?.from("info_pratiques")
      .select("*")
      .order("display_order")) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Infos pratiques"
        description={`${rows?.length ?? 0} entrée${(rows?.length ?? 0) > 1 ? "s" : ""}`}
        newHref="/admin/info/new"
        newLabel="Nouvelle info"
      />
      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Catégorie</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Téléphone</th>
              <th className="px-4 py-3 text-center">État</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/info/${r.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600 inline-flex items-center gap-1.5"
                  >
                    {r.emergency && <Siren size={14} className="text-tiare-500" />}
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ocean-700">
                  {r.category}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-600">
                  {r.phone}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.published ? (
                    <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs">
                      Publiée
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 text-xs">
                      Brouillon
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminRowActions
                    table="info_pratiques"
                    id={r.id}
                    editHref={`/admin/info/${r.id}`}
                    published={r.published}
                  />
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ocean-500">
                  Aucune info pratique.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
