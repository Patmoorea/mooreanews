import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AccommodationRow } from "@/lib/supabase/types";

const TYPES = [
  { value: "hotel", label: "Hôtel / resort" },
  { value: "pension", label: "Pension" },
  { value: "fare", label: "Fare" },
  { value: "villa", label: "Villa / location" },
];

const AVAIL = [
  { value: "available", label: "Disponible" },
  { value: "limited", label: "Places limitées" },
  { value: "contact", label: "Contacter pour dispo" },
  { value: "full", label: "Complet" },
];

export function AccommodationForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: AccommodationRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <ImageUploadField
        name="cover_url"
        defaultValue={initial?.cover_url}
        label="Photo / vignette"
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field name="name" label="Nom" required defaultValue={initial?.name} />
        <Field
          name="slug"
          label="Slug URL"
          defaultValue={initial?.slug}
          placeholder="pension-kaveka"
          help="hebergements/[slug]"
        />
      </div>
      <TextArea
        name="description"
        label="Description"
        required
        rows={4}
        defaultValue={initial?.description}
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="type"
          label="Type"
          required
          defaultValue={initial?.type ?? "pension"}
          options={TYPES}
        />
        <Select
          name="district"
          label="District"
          required
          defaultValue={initial?.district ?? "Paopao"}
          options={Array.from(MOOREA_DISTRICTS)}
        />
      </div>
      <Field name="address" label="Adresse" defaultValue={initial?.address ?? ""} />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field name="phone" label="Téléphone" defaultValue={initial?.phone ?? ""} />
        <Field name="email" label="Email" defaultValue={initial?.email ?? ""} />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field name="url" label="Site web / réservation" defaultValue={initial?.url ?? ""} />
        <Field
          name="price_hint"
          label="Fourchette prix"
          defaultValue={initial?.price_hint ?? ""}
          placeholder="€€ ou à partir de 120€/nuit"
        />
      </div>
      <Select
        name="availability_status"
        label="Disponibilité affichée"
        defaultValue={initial?.availability_status ?? "contact"}
        options={AVAIL}
      />
      <div className="grid sm:grid-cols-3 gap-5">
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
        <Field
          name="display_order"
          label="Ordre"
          type="number"
          defaultValue={String(initial?.display_order ?? 0)}
        />
      </div>
      <Field
        name="merchant_email"
        label="Email commerçant (premium)"
        defaultValue={initial?.merchant_email ?? ""}
      />
      <div className="grid sm:grid-cols-2 gap-5 pt-2">
        <Checkbox
          name="published"
          label="Publié"
          defaultChecked={initial?.published ?? true}
        />
        <Checkbox
          name="featured"
          label="À la une visiteurs"
          defaultChecked={initial?.featured ?? false}
        />
      </div>
      <FormActions cancelHref="/admin/accommodations" />
    </form>
  );
}
