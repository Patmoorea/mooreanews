import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { listMissingAccommodationsFromJson } from "@/lib/supabase/sync-accommodations";
import { isMissingSchemaError } from "@/lib/supabase/schema-errors";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { ImportAccommodationsBanner } from "@/components/admin/ImportAccommodationsBanner";
import {
  accommodationTypeLabel,
  availabilityLabel,
} from "@/lib/accommodations";

export const metadata = { title: "Hébergements" };

export default async function AdminAccommodationsPage() {
  const supabase = await getServerSupabase();
  const { data: rows, error: listError } =
    (await supabase
      ?.from("accommodations")
      .select("*")
      .order("display_order", { ascending: true })) ?? { data: [], error: null };

  const tableMissing =
    Boolean(listError) &&
    isMissingSchemaError(listError!.message, "accommodations");

  const { missing, tableMissing: missingProbe } =
    await listMissingAccommodationsFromJson();

  return (
    <div>
      <AdminPageHeader
        title="Hébergements"
        description={`${rows?.length ?? 0} fiche(s) — annuaire visiteurs /visiteurs`}
        newHref="/admin/accommodations/new"
        newLabel="Nouvel hébergement"
      />
      <ImportAccommodationsBanner
        missingNames={missing.map((m) => m.name)}
        tableMissing={tableMissing || missingProbe}
      />
      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Type</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Quartier</th>
              <th className="px-4 py-3 text-center">Dispo</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(rows ?? []).map((r) => (
              <tr key={r.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/accommodations/${r.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600"
                  >
                    {r.name}
                    {r.featured && <span className="ml-2 text-tiare-500">★</span>}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-ocean-700">
                  {accommodationTypeLabel(r.type)}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-ocean-600">
                  {r.district}
                </td>
                <td className="px-4 py-3 text-center text-xs">
                  {availabilityLabel(r.availability_status)}
                </td>
                <td className="px-4 py-3 text-right">
                  <AdminRowActions
                    table="accommodations"
                    id={r.id}
                    editHref={`/admin/accommodations/${r.id}`}
                    published={r.published}
                  />
                </td>
              </tr>
            ))}
            {(rows ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ocean-500">
                  Aucun hébergement — importez le catalogue ou créez une fiche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
