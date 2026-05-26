/**
 * Champs de formulaire réutilisables pour l'admin.
 */

const INPUT_CLASS =
  "w-full px-3 py-2 bg-white border border-ocean-200 rounded-lg text-sm text-ocean-900 focus:outline-none focus:border-lagon-500 focus:ring-2 focus:ring-lagon-200";

type FieldProps = {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string | number | null;
  placeholder?: string;
  help?: string;
};

export function Field({
  name,
  label,
  required,
  defaultValue,
  placeholder,
  help,
  type = "text",
}: FieldProps & { type?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ocean-800 mb-1">
        {label}
        {required && <span className="text-tiare-500 ml-0.5">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
      {help && <span className="block mt-1 text-xs text-ocean-500">{help}</span>}
    </label>
  );
}

export function TextArea({
  name,
  label,
  required,
  defaultValue,
  placeholder,
  help,
  rows = 4,
}: FieldProps & { rows?: number }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ocean-800 mb-1">
        {label}
        {required && <span className="text-tiare-500 ml-0.5">*</span>}
      </span>
      <textarea
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={rows}
        className={INPUT_CLASS}
      />
      {help && <span className="block mt-1 text-xs text-ocean-500">{help}</span>}
    </label>
  );
}

export function Select({
  name,
  label,
  required,
  defaultValue,
  options,
  help,
}: FieldProps & { options: string[] | { value: string; label: string }[] }) {
  const opts = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ocean-800 mb-1">
        {label}
        {required && <span className="text-tiare-500 ml-0.5">*</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={(defaultValue ?? "") as string}
        className={INPUT_CLASS}
      >
        {!required && <option value="">—</option>}
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {help && <span className="block mt-1 text-xs text-ocean-500">{help}</span>}
    </label>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
  help,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  help?: string;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 w-4 h-4 accent-lagon-500"
      />
      <span>
        <span className="block text-sm font-medium text-ocean-800">
          {label}
        </span>
        {help && (
          <span className="block text-xs text-ocean-500 mt-0.5">{help}</span>
        )}
      </span>
    </label>
  );
}

export function FormActions({
  submitLabel = "Enregistrer",
  cancelHref,
}: {
  submitLabel?: string;
  cancelHref: string;
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-ocean-100">
      <a
        href={cancelHref}
        className="px-4 py-2 rounded-full text-sm text-ocean-700 hover:bg-ocean-50"
      >
        Annuler
      </a>
      <button
        type="submit"
        className="px-5 py-2.5 rounded-full bg-gradient-to-br from-lagon-500 to-ocean-700 text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-transform"
      >
        {submitLabel}
      </button>
    </div>
  );
}
