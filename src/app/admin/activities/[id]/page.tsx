import { notFound } from "next/navigation";
import { ActivityForm } from "@/components/admin/ActivityForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Éditer l'activité" };

type Props = { params: Promise<{ id: string }> };

export default async function EditActivityPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) notFound();
  const { data: row } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();
  async function action(formData: FormData) {
    "use server";
    await updateContent("activities", id, formData);
  }
  return (
    <div>
      <AdminPageHeader title="Éditer l'activité" description={row.name} />
      <ActivityForm action={action} initial={row} />
    </div>
  );
}
