import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { getMissingRestaurantsFromCatalog } from "@/lib/supabase/sync-restaurants";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { ImportRestaurantsBanner } from "@/components/admin/ImportRestaurantsBanner";
import { SyncRestaurantHoursButton } from "@/components/admin/SyncRestaurantHoursButton";

export const metadata = { title: "Restaurants" };

export default async function AdminRestaurantsPage() {
  const supabase = await getServerSupabase();
  const { data: rows } =
    (await supabase
      ?.from("restaurants")
      .select("*")
      .order("featured", { ascending: false })) ?? { data: [] };

  const missing = getMissingRestaurantsFromCatalog(
    (rows ?? []).map((r) => r.name),
    { importCandidatesOnly: true }
  );
  const missingNames = missing.map((r) => r.name);

  return (
    <div>
      <AdminPageHeader
        title="Restaurants"
        description={`${rows?.length ?? 0} restaurant${(rows?.length ?? 0) > 1 ? "s" : ""} en base`}
        newHref="/admin/restaurants/new"
        newLabel="Nouveau restaurant"
      />
      <ImportRestaurantsBanner missingNames={missingNames} />
      <SyncRestaurantHoursButton />
      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">District</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Cuisine</th>
              <th className="px-4 py-3 text-center">État</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/restaurants/${r.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600"
                  >
                    {r.name}
                    {r.featured && <span className="ml-2 text-tiare-500">★</span>}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ocean-700">
                  {r.district}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-600 text-xs">
                  {r.cuisine?.join(", ")}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.published ? (
                    <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs">
                      Publié
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-600 text-xs">
                      Brouillon
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminRowActions
                    table="restaurants"
                    id={r.id}
                    editHref={`/admin/restaurants/${r.id}`}
                    published={r.published}
                  />
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ocean-500">
                  Aucun restaurant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
