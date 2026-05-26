import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContent } from "@/app/admin/actions";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata = { title: "Éditer l'événement" };

type Props = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  if (!supabase) notFound();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!event) notFound();

  async function action(formData: FormData) {
    "use server";
    await updateContent("events", id, formData);
  }
  return (
    <div>
      <AdminPageHeader title="Éditer l'événement" description={event.title} />
      <EventForm action={action} initial={event} />
    </div>
  );
}
