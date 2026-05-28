import { notFound } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AlertForm } from "@/components/admin/AlertForm";
import { updateContent } from "@/app/admin/actions";

export const metadata = { title: "Modifier alerte" };

type Props = { params: Promise<{ id: string }> };

export default async function EditAlertPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerSupabase();
  const { data: row } = (await supabase
    ?.from("alerts")
    .select("*")
    .eq("id", id)
    .maybeSingle()) ?? { data: null };

  if (!row) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Modifier alerte"
        description="Active + urgente = bandeau BREAKING NEWS sur le site."
      />
      <AlertForm
        initial={row}
        action={async (fd) => {
          "use server";
          await updateContent("alerts", id, fd);
        }}
      />
    </div>
  );
}

