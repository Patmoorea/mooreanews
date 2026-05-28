import { redirect } from "next/navigation";
import { createContent } from "@/app/admin/actions";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AlertForm } from "@/components/admin/AlertForm";

export const metadata = { title: "Nouvelle alerte" };

export default function NewAlertPage() {
  return (
    <div>
      <AdminPageHeader
        title="Nouvelle alerte"
        description="Une alerte active + urgente s’affiche en BREAKING NEWS."
      />

      <AlertForm
        action={async (fd) => {
          "use server";
          await createContent("alerts", fd);
          redirect("/admin/alerts");
        }}
      />
    </div>
  );
}

