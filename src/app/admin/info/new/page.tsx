import { InfoForm } from "@/components/admin/InfoForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouvelle info" };

export default function NewInfoPage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("info_pratiques", formData);
  }
  return (
    <div>
      <AdminPageHeader title="Nouvelle info pratique" />
      <InfoForm action={action} />
    </div>
  );
}
