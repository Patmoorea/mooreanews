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
      <div className="rounded-2xl border border-lagon-200 bg-lagon-50/60 p-4 space-y-4">
        <p className="text-sm font-semibold text-ocean-900">
          Carte interactive
        </p>
        <p className="text-xs text-ocean-600">
          Copiez latitude / longitude depuis Google Maps (clic droit sur le lieu)
          pour afficher ce point sur la carte de l&apos;accueil.
        </p>
        <div className="grid sm:grid-cols-2 gap-5">
          <Field
            name="lat"
            label="Latitude"
            type="number"
            defaultValue={initial?.lat?.toString()}
            placeholder="-17.5185"
          />
          <Field
            name="lon"
            label="Longitude"
            type="number"
            defaultValue={initial?.lon?.toString()}
            placeholder="-149.772"
          />
        </div>
        <Field
          name="map_icon_url"
          label="Logo sur la carte (optionnel)"
          defaultValue={initial?.map_icon_url ?? ""}
          placeholder="/partners/mon-logo.png ou https://…"
          help="Image carrée recommandée. RAI TAHITI : laissez vide pour le logo croix rouge par défaut."
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
          name="emergency"
          label="Urgence (mis en évidence)"
          defaultChecked={initial?.emergency ?? false}
        />
      </div>
      <FormActions cancelHref="/admin/info" />
    </form>
  );
}
