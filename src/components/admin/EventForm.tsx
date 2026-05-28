import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { EventRow } from "@/lib/supabase/types";

const CATEGORIES = [
  "marche",
  "culture",
  "sport",
  "musique",
  "atelier",
  "associatif",
  "religieux",
  "communaute",
];

export function EventForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: EventRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <ImageUploadField
        name="cover_url"
        defaultValue={initial?.cover_url}
        label="Affiche — à mettre en premier"
        help="Choisissez la photo du flyer. Elle s’affiche sur l’agenda dès que l’événement est publié."
      />
      <Field
        name="title"
        label="Titre de l'événement"
        required
        defaultValue={initial?.title}
      />
      <TextArea
        name="description"
        label="Description"
        required
        defaultValue={initial?.description}
        rows={5}
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="category"
          label="Catégorie"
          required
          defaultValue={initial?.category ?? "communaute"}
          options={CATEGORIES}
        />
        <Select
          name="district"
          label="District"
          defaultValue={initial?.district}
          options={Array.from(MOOREA_DISTRICTS)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="date"
          label="Date"
          type="date"
          required
          defaultValue={initial?.date}
        />
        <Field
          name="end_date"
          label="Date de fin (optionnel)"
          type="date"
          defaultValue={initial?.end_date}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="start_time"
          label="Heure de début"
          type="time"
          defaultValue={initial?.start_time}
        />
        <Field
          name="end_time"
          label="Heure de fin"
          type="time"
          defaultValue={initial?.end_time}
        />
      </div>
      <Field
        name="location"
        label="Lieu"
        required
        defaultValue={initial?.location}
        placeholder="Ex. Salle omnisports de Vaiare"
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="organizer"
          label="Organisateur"
          defaultValue={initial?.organizer}
        />
        <Field
          name="contact"
          label="Contact"
          defaultValue={initial?.contact}
          placeholder="email ou téléphone"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          name="price"
          label="Prix"
          defaultValue={initial?.price}
          placeholder="Ex. Gratuit, 1 000 XPF"
        />
        <Field
          name="url"
          label="Lien (site, billetterie)"
          defaultValue={initial?.url}
        />
      </div>
      <Checkbox
        name="published"
        label="Publié"
        defaultChecked={initial?.published ?? true}
      />
      <FormActions cancelHref="/admin/events" />
    </form>
  );
}
