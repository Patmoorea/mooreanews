import { ActivityForm } from "@/components/admin/ActivityForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouvelle activité" };

export default function NewActivityPage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("activities", formData);
  }
  return (
    <div>
      <AdminPageHeader title="Nouvelle activité" />
      <ActivityForm action={action} />
    </div>
  );
}
