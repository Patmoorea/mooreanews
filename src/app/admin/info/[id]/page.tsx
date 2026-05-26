import { notFound } from "next/navigation";
import { InfoForm } from "@/components/admin/InfoForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Éditer l'info" };

type Props = { params: Promise<{ id: string }> };

export default async function EditInfoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) notFound();
  const { data: row } = await supabase
    .from("info_pratiques")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();
  async function action(formData: FormData) {
    "use server";
    await updateContent("info_pratiques", id, formData);
  }
  return (
    <div>
      <AdminPageHeader title="Éditer l'info" description={row.title} />
      <InfoForm action={action} initial={row} />
    </div>
  );
}
