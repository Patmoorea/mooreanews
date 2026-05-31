import { notFound } from "next/navigation";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

import { backfillRestaurantHoursFromCatalog } from "@/lib/supabase/sync-restaurants";

export const metadata = { title: "Éditer le restaurant" };

type Props = { params: Promise<{ id: string }> };

export default async function EditRestaurantPage({ params }: Props) {
  const { id } = await params;
  await backfillRestaurantHoursFromCatalog();

  const supabase = await getServerSupabase();
  if (!supabase) notFound();
  const { data: row } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();
  async function action(formData: FormData) {
    "use server";
    await updateContent("restaurants", id, formData);
  }
  return (
    <div>
      <AdminPageHeader title="Éditer le restaurant" description={row.name} />
      <RestaurantForm action={action} initial={row} />
    </div>
  );
}
