import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createContent } from "@/app/admin/actions";

export const metadata = { title: "Nouveau restaurant" };

export default function NewRestaurantPage() {
  async function action(formData: FormData) {
    "use server";
    await createContent("restaurants", formData);
  }
  return (
    <div>
      <AdminPageHeader title="Nouveau restaurant" />
      <RestaurantForm action={action} />
    </div>
  );
}
