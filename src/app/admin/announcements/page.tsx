import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { formatDateShortFR } from "@/lib/utils";

export const metadata = { title: "Annonces" };

export default async function AdminAnnouncementsPage() {
  const supabase = await getServerSupabase();
  const { data: rows } =
    (await supabase
      ?.from("announcements")
      .select("*")
      .order("created_at", { ascending: false })) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Annonces"
        description={`${rows?.length ?? 0} annonce${(rows?.length ?? 0) > 1 ? "s" : ""}`}
        newHref="/admin/announcements/new"
        newLabel="Nouvelle annonce"
      />
      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Catégorie</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Créée</th>
              <th className="px-4 py-3 text-center">État</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/announcements/${r.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600"
                  >
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ocean-700">
                  {r.category}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-600">
                  {formatDateShortFR(r.created_at)}
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
                    table="announcements"
                    id={r.id}
                    editHref={`/admin/announcements/${r.id}`}
                    published={r.published}
                  />
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ocean-500">
                  Aucune annonce.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
