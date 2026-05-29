import Link from "next/link";
import { Eye, Star } from "lucide-react";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { CleanupFacebookImportsBanner } from "@/components/admin/CleanupFacebookImportsBanner";
import { formatDateShortFR } from "@/lib/utils";

export const metadata = { title: "Articles" };

export default async function AdminArticlesPage() {
  const supabase = await getServerSupabase();
  const { data: articles } =
    (await supabase?.from("articles").select("*").order("published_at", {
      ascending: false,
    })) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Articles"
        description={`${articles?.length ?? 0} article${(articles?.length ?? 0) > 1 ? "s" : ""}`}
        newHref="/admin/articles/new"
        newLabel="Nouvel article"
      />

      <CleanupFacebookImportsBanner />

      <div className="bg-white rounded-2xl border border-ocean-100 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-ocean-50 text-xs uppercase tracking-wide text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-center">État</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(articles ?? []).map((a) => (
              <tr key={a.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600"
                  >
                    {a.title}
                    {a.featured && (
                      <Star
                        size={12}
                        className="inline-block ml-1.5 text-tiare-500 fill-tiare-500"
                      />
                    )}
                  </Link>
                  <p className="text-xs text-ocean-500 mt-0.5 truncate max-w-md">
                    /{a.slug}
                  </p>
                </td>
                <td className="px-4 py-3 text-sm text-ocean-700 hidden md:table-cell">
                  {a.category}
                </td>
                <td className="px-4 py-3 text-sm text-ocean-600 hidden lg:table-cell">
                  {formatDateShortFR(a.published_at)}
                </td>
                <td className="px-4 py-3 text-center">
                  {a.published ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs font-semibold">
                      <Eye size={10} />
                      Publié
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 text-xs font-semibold">
                      Brouillon
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminRowActions
                    table="articles"
                    id={a.id}
                    editHref={`/admin/articles/${a.id}`}
                    published={a.published}
                    itemLabel={`l'article « ${a.title} »`}
                  />
                </td>
              </tr>
            ))}
            {(articles ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-ocean-500"
                >
                  Aucun article. Cliquez sur{" "}
                  <Link href="/admin/articles/new" className="text-tiare-600">
                    Nouvel article
                  </Link>{" "}
                  pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
