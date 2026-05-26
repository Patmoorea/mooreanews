import { notFound } from "next/navigation";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Éditer l'annonce" };

type Props = { params: Promise<{ id: string }> };

export default async function EditAnnouncementPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) notFound();
  const { data: row } = await supabase
    .from("announcements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();
  async function action(formData: FormData) {
    "use server";
    await updateContent("announcements", id, formData);
  }
  return (
    <div>
      <AdminPageHeader title="Éditer l'annonce" description={row.title} />
      <AnnouncementForm action={action} initial={row} />
    </div>
  );
}
