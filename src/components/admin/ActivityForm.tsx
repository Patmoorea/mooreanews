import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import type { ActivityRow } from "@/lib/supabase/types";

const CATEGORIES = [
  "plongee",
  "snorkeling",
  "kayak",
  "rando",
  "lagon",
  "culture",
  "bien-etre",
  "famille",
];

export function ActivityForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: ActivityRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <Field name="name" label="Nom" required defaultValue={initial?.name} />
      <TextArea
        name="description"
        label="Description"
        required
        rows={4}
        defaultValue={initial?.description}
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="category"
          label="Catégorie"
          required
          defaultValue={initial?.category ?? "lagon"}
          options={CATEGORIES}
        />
        <Select
          name="district"
          label="District"
          defaultValue={initial?.district}
          options={Array.from(MOOREA_DISTRICTS)}
        />
      </div>
      <Field name="address" label="Adresse" defaultValue={initial?.address} />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field name="phone" label="Téléphone" defaultValue={initial?.phone} />
        <Field
          name="duration"
          label="Durée"
          defaultValue={initial?.duration}
          placeholder="Ex. 3h, demi-journée"
        />
      </div>
      <Field
        name="price"
        label="Prix"
        defaultValue={initial?.price}
        placeholder="Ex. 8 000 XPF / personne"
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="lat"
          label="Latitude"
          type="number"
          defaultValue={initial?.lat?.toString()}
        />
        <Field
          name="lon"
          label="Longitude"
          type="number"
          defaultValue={initial?.lon?.toString()}
        />
      </div>
      <Field name="url" label="Site web" defaultValue={initial?.url} />
      <div className="grid sm:grid-cols-2 gap-5 pt-2">
        <Checkbox
          name="published"
          label="Publié"
          defaultChecked={initial?.published ?? true}
        />
        <Checkbox
          name="featured"
          label="Mis en avant"
          defaultChecked={initial?.featured ?? false}
        />
      </div>
      <FormActions cancelHref="/admin/activities" />
    </form>
  );
}
