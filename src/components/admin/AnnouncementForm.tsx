import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import type { AnnouncementRow } from "@/lib/supabase/types";

const CATEGORIES = ["immobilier", "emploi", "services", "vente", "echange", "general"];

export function AnnouncementForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: AnnouncementRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <Field name="title" label="Titre" required defaultValue={initial?.title} />
      <TextArea
        name="body"
        label="Description"
        required
        rows={6}
        defaultValue={initial?.body}
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="category"
          label="Catégorie"
          required
          defaultValue={initial?.category ?? "general"}
          options={CATEGORIES}
        />
        <Select
          name="district"
          label="District"
          defaultValue={initial?.district}
          options={Array.from(MOOREA_DISTRICTS)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="price"
          label="Prix"
          defaultValue={initial?.price}
          placeholder="Ex. 50 000 XPF / mois"
        />
        <Field
          name="contact"
          label="Contact"
          defaultValue={initial?.contact}
          placeholder="email ou téléphone"
        />
      </div>
      <Field name="author" label="Auteur" defaultValue={initial?.author} />
      <Checkbox
        name="published"
        label="Publié"
        defaultChecked={initial?.published ?? true}
      />
      <FormActions cancelHref="/admin/announcements" />
    </form>
  );
}
