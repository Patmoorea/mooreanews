import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import type { InfoRow } from "@/lib/supabase/types";

const CATEGORIES = [
  "urgence",
  "sante",
  "administration",
  "transport",
  "commerce",
  "education",
  "religieux",
];

export function InfoForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: InfoRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <Field name="title" label="Titre" required defaultValue={initial?.title} />
      <TextArea
        name="description"
        label="Description"
        required
        rows={3}
        defaultValue={initial?.description}
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="category"
          label="Catégorie"
          required
          defaultValue={initial?.category ?? "administration"}
          options={CATEGORIES}
        />
        <Field
          name="display_order"
          label="Ordre d'affichage"
          type="number"
          defaultValue={initial?.display_order ?? 0}
          help="Plus petit = en haut"
        />
      </div>
      <Field name="address" label="Adresse" defaultValue={initial?.address} />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field name="phone" label="Téléphone" defaultValue={initial?.phone} />
        <Field name="hours" label="Horaires" defaultValue={initial?.hours} />
      </div>
      <Field name="url" label="Site web" defaultValue={initial?.url} />
      <div className="grid sm:grid-cols-2 gap-5 pt-2">
        <Checkbox
          name="published"
          label="Publié"
          defaultChecked={initial?.published ?? true}
        />
        <Checkbox
          name="emergency"
          label="Urgence (mis en évidence)"
          defaultChecked={initial?.emergency ?? false}
        />
      </div>
      <FormActions cancelHref="/admin/info" />
    </form>
  );
}
