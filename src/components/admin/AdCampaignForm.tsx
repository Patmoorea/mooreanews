import {
  Field,
  TextArea,
  Checkbox,
  FormActions,
  Select,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { AdCampaignRow, AdFormat, AdPackageId } from "@/lib/ads-types";
import { AD_FORMAT_DISPLAY } from "@/lib/ad-format-sizes";
import {
  AD_FORMATS,
  formatUploadHelp,
  parseFormatImagesJson,
} from "@/lib/ads-format-images";
import {
  AD_PACKAGES,
  AD_PACKAGE_IDS,
  formatsForPackage,
  getAdPackage,
  packagePlacementLabels,
  DEFAULT_CAMPAIGN_PACKAGE,
} from "@/lib/ad-packages";

export function AdCampaignForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: AdCampaignRow | null;
}) {
  const isNew = !initial;
  const formatImages = parseFormatImagesJson(initial?.format_images ?? null);
  const packageId: AdPackageId =
    (initial?.ad_package as AdPackageId) ||
    (initial?.id ? DEFAULT_CAMPAIGN_PACKAGE[initial.id] : undefined) ||
    "cible";
  const pkg = getAdPackage(packageId);
  const includedSet = new Set(formatsForPackage(packageId));

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

      <Select
        name="ad_package"
        label="Forfait publicitaire"
        required
        defaultValue={packageId}
        options={AD_PACKAGE_IDS.map((id) => ({
          value: id,
          label: `${AD_PACKAGES[id].name} — dès ${AD_PACKAGES[id].fromXpf} XPF/mois`,
        }))}
        help="Détermine les emplacements sur le site et les bannières à fournir. Mêmes règles pour tous les annonceurs."
      />

      <div className="rounded-xl border border-lagon-200 bg-lagon-50/50 p-4 text-sm text-ocean-800">
        <p className="font-semibold text-ocean-900">
          Forfait {pkg.name} — {pkg.tagline}
        </p>
        <ul className="mt-2 list-disc list-inside space-y-0.5">
          {pkg.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-ocean-950">Bannières par format</h3>
          <p className="mt-1 text-sm text-ocean-600">
            Téléversez <strong>un fichier par format</strong> inclus dans le forfait, aux
            dimensions exactes. Le site affiche le bon fichier — sans étirement.
          </p>
        </div>

        {formatsForPackage(packageId).length > 0 && (
          <div className="rounded-xl border border-tipanier-200 bg-tipanier-50/60 p-4 text-sm text-ocean-800">
            <p className="font-semibold text-ocean-900">
              Emplacements inclus dans votre forfait :
            </p>
            <ul className="mt-2 list-disc list-inside space-y-0.5">
              {packagePlacementLabels(packageId).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-5">
          {AD_FORMATS.map((format) => {
            const spec = AD_FORMAT_DISPLAY[format];
            const includedInPackage = includedSet.has(format);
            const isSidebar = format === "sidebar";
            if (isSidebar) return null;
            return (
              <div
                key={format}
                className={
                  includedInPackage
                    ? "rounded-2xl ring-2 ring-lagon-300 ring-offset-2"
                    : undefined
                }
              >
                <ImageUploadField
                  name={`format_image_${format}`}
                  label={`${spec.label}${includedInPackage ? " — inclus dans votre forfait" : ""}`}
                  defaultValue={formatImages[format]}
                  help={
                    includedInPackage
                      ? formatUploadHelp(format)
                      : `${formatUploadHelp(format)} Hors forfait ${pkg.name} — optionnel.`
                  }
                  required={includedInPackage}
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
