import {
  Field,
  TextArea,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdCampaignRow } from "@/lib/ads-types";

export function AdCampaignForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: AdCampaignRow | null;
}) {
  const isNew = !initial;

  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      {initial ? (
        <input type="hidden" name="id" value={initial.id} />
      ) : (
        <Field
          name="new_id"
          label="Identifiant (slug)"
          required
          placeholder="ex. moorea-maitai"
          help="Lettres minuscules et tirets — utilisé en interne"
        />
      )}

      <ImageUploadField
        name="image"
        defaultValue={initial?.image}
        label="Visuel bannière"
        help="Bannière complète — affichée sans rognage (1536×1024 recommandé)"
      />

      <Field name="name" label="Nom campagne" required defaultValue={initial?.name} />
      <Field
        name="sponsor"
        label="Nom partenaire (libellé court)"
        defaultValue={initial?.sponsor ?? ""}
      />
      <Field name="href" label="Lien de destination" required defaultValue={initial?.href} type="url" />
      <TextArea name="alt" label="Texte alternatif (accessibilité + SEO)" rows={3} defaultValue={initial?.alt} />

      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="image_width"
          label="Largeur image (px)"
          type="number"
          defaultValue={String(initial?.image_width ?? 1536)}
        />
        <Field
          name="image_height"
          label="Hauteur image (px)"
          type="number"
          defaultValue={String(initial?.image_height ?? 1024)}
        />
      </div>

      <Checkbox name="active" label="Campagne active" defaultChecked={initial?.active ?? true} />

      <FormActions
        submitLabel={isNew ? "Créer la campagne" : "Enregistrer"}
        cancelHref="/admin/ads"
      />
    </form>
  );
}
