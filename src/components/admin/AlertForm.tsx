import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { MOOREA_DISTRICTS } from "@/lib/constants";
import type { AlertRow, AlertSeverity, AlertType } from "@/lib/supabase/types";

const TYPES: { value: AlertType; label: string }[] = [
  { value: "coupure_eau", label: "🚰 Coupure d’eau" },
  { value: "coupure_edt", label: "⚡ Coupure EDT" },
  { value: "route", label: "🚧 Route / travaux" },
  { value: "houle", label: "🌊 Houle" },
  { value: "ferry", label: "⛴ Ferry" },
  { value: "meteo", label: "⛅ Météo" },
  { value: "autre", label: "ℹ️ Autre" },
];

const SEVERITIES: { value: AlertSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "alert", label: "Alerte" },
];

export function AlertForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: AlertRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="type"
          label="Type"
          required
          defaultValue={initial?.type ?? "autre"}
          options={TYPES}
        />
        <Select
          name="severity"
          label="Gravité"
          required
          defaultValue={initial?.severity ?? "info"}
          options={SEVERITIES}
        />
      </div>

      <Field
        name="title"
        label="Titre court"
        required
        defaultValue={initial?.title}
        placeholder="Ex. Coupure EDT Maharepa — 13h à 15h"
      />

      <TextArea
        name="details"
        label="Détails (optionnel)"
        defaultValue={initial?.details ?? undefined}
        rows={4}
        help="Texte court. Évitez les pavés."
      />

      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="district"
          label="District (optionnel)"
          defaultValue={initial?.district ?? ""}
          options={[{ value: "", label: "—" }, ...Array.from(MOOREA_DISTRICTS).map((d) => ({ value: d, label: d }))]}
        />
        <Field
          name="source_url"
          label="Lien source (optionnel)"
          defaultValue={initial?.source_url ?? undefined}
          placeholder="https://…"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="starts_at"
          label="Début (optionnel)"
          type="datetime-local"
          defaultValue={initial?.starts_at ? toDatetimeLocal(initial.starts_at) : undefined}
          help="Heure de Tahiti. Avant cette heure, l’alerte reste masquée."
        />
        <Field
          name="ends_at"
          label="Fin (optionnel)"
          type="datetime-local"
          defaultValue={initial?.ends_at ? toDatetimeLocal(initial.ends_at) : undefined}
          help="Heure de Tahiti. À la fin, l’alerte disparaît du site automatiquement."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5 pt-2">
        <Checkbox name="active" label="Active" defaultChecked={initial?.active ?? true} />
        <Checkbox name="urgent" label="BREAKING NEWS (urgent)" defaultChecked={initial?.urgent ?? false} />
      </div>

      <FormActions cancelHref="/admin/alerts" />
    </form>
  );
}

function toDatetimeLocal(iso: string): string {
  // iso -> yyyy-MM-ddTHH:mm (local) ; suffisant pour input datetime-local
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

