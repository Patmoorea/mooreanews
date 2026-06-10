import {
  Field,
  TextArea,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdCampaignRow, AdFormat } from "@/lib/ads-types";
import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";
import {
  AD_FORMATS,
  formatUploadHelp,
  parseFormatImagesJson,
} from "@/lib/ads-format-images";

export function AdCampaignForm({
  action,
  initial,
  usedFormats = [],
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: AdCampaignRow | null;
  /** Formats requis sur le site pour cette campagne (emplacements assignés). */
  usedFormats?: AdFormat[];
}) {
  const isNew = !initial;
  const formatImages = parseFormatImagesJson(initial?.format_images ?? null);
  const usedSet = new Set(usedFormats);

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

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-ocean-950">Bannières par format</h3>
          <p className="mt-1 text-sm text-ocean-600">
            Téléversez <strong>un fichier par format</strong>, aux dimensions exactes indiquées.
            Le site affiche le bon fichier selon l&apos;emplacement — sans étirement ni recadrage
            automatique.
          </p>
        </div>

        {usedFormats.length > 0 && (
          <div className="rounded-xl border border-tipanier-200 bg-tipanier-50/60 p-4 text-sm text-ocean-800">
            <p className="font-semibold text-ocean-900">Formats utilisés sur le site pour cette campagne :</p>
            <ul className="mt-2 list-disc list-inside space-y-0.5">
              {usedFormats.map((format) => {
                const spec = AD_FORMAT_DISPLAY[format];
                return (
                  <li key={format}>
                    {spec.label} ({spec.width}×{spec.height} px)
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="grid gap-5">
          {AD_FORMATS.map((format) => {
            const spec = AD_FORMAT_DISPLAY[format];
            const requiredOnSite = usedSet.has(format);
            const isSidebar = format === "sidebar";
            return (
              <div
                key={format}
                className={
                  requiredOnSite
                    ? "rounded-2xl ring-2 ring-lagon-300 ring-offset-2"
                    : undefined
                }
              >
                <ImageUploadField
                  name={`format_image_${format}`}
                  label={`${spec.label}${requiredOnSite ? " — requis sur le site" : ""}`}
                  defaultValue={formatImages[format]}
                  help={
                    isSidebar
                      ? `${formatUploadHelp(format)} Même visuel que le rectangle 300×250 si vous n’en avez qu’un.`
                      : formatUploadHelp(format)
                  }
                  required={requiredOnSite}
                />
              </div>
            );
          })}
        </div>
      </div>

      <Field name="name" label="Nom campagne" required defaultValue={initial?.name} />
      <Field
        name="sponsor"
        label="Nom partenaire (libellé court)"
        defaultValue={initial?.sponsor ?? ""}
      />
      <Field name="href" label="Lien de destination" required defaultValue={initial?.href} type="url" />
      <TextArea name="alt" label="Texte alternatif (accessibilité + SEO)" rows={3} defaultValue={initial?.alt} />

      <Checkbox name="active" label="Campagne active" defaultChecked={initial?.active ?? true} />

      <FormActions
        submitLabel={isNew ? "Créer la campagne" : "Enregistrer"}
        cancelHref="/admin/ads"
      />
    </form>
  );
}
