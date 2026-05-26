import Link from "next/link";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { formatDateShortFR } from "@/lib/utils";

export const metadata = { title: "Événements" };

export default async function AdminEventsPage() {
  const supabase = await getServerSupabase();
  const { data: events } =
    (await supabase?.from("events").select("*").order("date")) ?? { data: [] };

  return (
    <div>
      <AdminPageHeader
        title="Événements"
        description={`${events?.length ?? 0} événement${(events?.length ?? 0) > 1 ? "s" : ""}`}
        newHref="/admin/events/new"
        newLabel="Nouvel événement"
      />
      <div className="bg-white rounded-2xl border border-ocean-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ocean-50 text-xs uppercase text-ocean-600">
            <tr>
              <th className="px-4 py-3 text-left">Titre</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Lieu</th>
              <th className="px-4 py-3 text-center">État</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-100">
            {(events ?? []).map((e) => (
              <tr key={e.id} className="hover:bg-ocean-50/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${e.id}`}
                    className="font-medium text-ocean-900 hover:text-tiare-600"
                  >
                    {e.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ocean-700 hidden md:table-cell">
                  {formatDateShortFR(e.date)}
                  {e.start_time && (
                    <span className="text-ocean-500">
                      {" "}
                      · {e.start_time.slice(0, 5)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ocean-600 hidden lg:table-cell">
                  {e.location}
                </td>
                <td className="px-4 py-3 text-center">
                  {e.published ? (
                    <span className="px-2 py-0.5 rounded-full bg-tipanier-100 text-tipanier-700 text-xs font-semibold">
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
                    table="events"
                    id={e.id}
                    editHref={`/admin/events/${e.id}`}
                    published={e.published}
                    itemLabel={`l'événement « ${e.title} »`}
                  />
                </td>
              </tr>
            ))}
            {(events ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-ocean-500">
                  Aucun événement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
