import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouvelle annonce" };

export default function NewAnnouncementPage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("announcements", formData);
  }
  return (
    <div>
      <AdminPageHeader title="Nouvelle annonce" />
      <AnnouncementForm action={action} />
    </div>
  );
}
