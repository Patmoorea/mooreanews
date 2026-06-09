import {
  Field,
  TextArea,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdCampaignRow } from "@/lib/ads-types";
import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";

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
        help="Format paysage large (ex. 970×250 ou 728×90). Le site recadre automatiquement selon l’emplacement (Leaderboard, Rectangle…)."
      />

      <div className="rounded-xl border border-lagon-100 bg-lagon-50/50 p-4 text-xs text-ocean-700 space-y-1">
        <p className="font-semibold text-ocean-900">Tailles d’affichage sur le site :</p>
        {Object.entries(AD_FORMAT_DISPLAY).map(([key, v]) => (
          <p key={key}>
            <span className="font-medium">{v.label}</span>
            {" — "}
            {v.width}×{v.height} px
          </p>
        ))}
      </div>

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
          defaultValue={String(initial?.image_width ?? 728)}
        />
        <Field
          name="image_height"
          label="Hauteur source (px)"
          type="number"
          defaultValue={String(initial?.image_height ?? 90)}
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
