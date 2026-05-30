import { AccommodationForm } from "@/components/admin/AccommodationForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouvel hébergement" };

export default function NewAccommodationPage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("accommodations", formData);
  }
  return (
    <div>
      <AdminPageHeader title="Nouvel hébergement" />
      <AccommodationForm action={action} />
    </div>
  );
}
