import { notFound } from "next/navigation";
import { AccommodationForm } from "@/components/admin/AccommodationForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Modifier hébergement" };

type Props = { params: Promise<{ id: string }> };

export default async function EditAccommodationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data: row } =
    (await supabase?.from("accommodations").select("*").eq("id", id).maybeSingle()) ?? {
      data: null,
    };
  if (!row) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateContent("accommodations", id, formData);
  }

  return (
    <div>
      <AdminPageHeader title={`Modifier — ${row.name}`} />
      <AccommodationForm action={action} initial={row} />
    </div>
  );
}
