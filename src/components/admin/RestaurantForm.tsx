import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import type { RestaurantRow } from "@/lib/supabase/types";

export function RestaurantForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: RestaurantRow | null;
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
        <Field
          name="cuisine"
          label="Cuisine"
          defaultValue={initial?.cuisine?.join(", ")}
          placeholder="Locale, Poissons, Fusion"
          help="Séparées par des virgules"
        />
        <Select
          name="district"
          label="District"
          required
          defaultValue={initial?.district ?? "Pao Pao"}
          options={Array.from(MOOREA_DISTRICTS)}
        />
      </div>
      <Field name="address" label="Adresse" required defaultValue={initial?.address} />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field name="phone" label="Téléphone" defaultValue={initial?.phone} />
        <Field
          name="price_range"
          label="Niveau de prix (1–4)"
          defaultValue={initial?.price_range}
          placeholder="1 = économique … 4 = gastronomique"
        />
      </div>
      <Field
        name="hours"
        label="Horaires"
        defaultValue={initial?.hours}
        placeholder="Ex. Mar-Dim 11h-14h, 18h-22h"
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="lat"
          label="Latitude (carte)"
          type="number"
          defaultValue={initial?.lat?.toString()}
          placeholder="-17.49"
        />
        <Field
          name="lon"
          label="Longitude (carte)"
          type="number"
          defaultValue={initial?.lon?.toString()}
          placeholder="-149.83"
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
      <FormActions cancelHref="/admin/restaurants" />
    </form>
  );
}
