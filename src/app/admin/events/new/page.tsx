import { EventForm } from "@/components/admin/EventForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouvel événement" };

export default function NewEventPage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("events", formData);
  }
  return (
    <div>
      <AdminPageHeader title="Nouvel événement" />
      <EventForm action={action} />
    </div>
  );
}
