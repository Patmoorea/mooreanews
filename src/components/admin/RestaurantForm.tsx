import { MOOREA_DISTRICTS } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { GooglePlaceIdSearch } from "@/components/admin/GooglePlaceIdSearch";
import { catalogOpeningHoursForRestaurant } from "@/lib/restaurant-catalog";
import type { RestaurantRow } from "@/lib/supabase/types";

export function RestaurantForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: RestaurantRow | null;
}) {
  const catalogHours = initial
    ? catalogOpeningHoursForRestaurant(initial.name, initial.id)
    : null;
  const hoursDefault = catalogHours ?? initial?.hours ?? "";
  const staleDbHours =
    catalogHours &&
    initial?.hours?.trim() &&
    catalogHours !== initial.hours.trim()
      ? initial.hours.trim()
      : null;
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <ImageUploadField
        name="cover_url"
        defaultValue={initial?.cover_url}
        label="Photo du restaurant / affiche"
      />
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
        label="Horaires (affichage fiche)"
        defaultValue={hoursDefault}
        placeholder="Ex. Mar-Dim 11h-14h, 18h-22h"
        help={
          staleDbHours
            ? `Catalogue appliqué (base avait « ${staleDbHours} »). Enregistrer pour écrire en Supabase. Le statut « ouvert » vient de Google ou du commerçant.`
            : "Texte informatif uniquement — le statut « ouvert » vient de Google ou du commerçant."
        }
      />
      <GooglePlaceIdSearch
        defaultPlaceId={initial?.google_place_id}
        restaurantName={initial?.name}
      />
      <Field
        name="merchant_email"
        label="Email commerçant (déclaration ouvert/fermé)"
        type="email"
        defaultValue={initial?.merchant_email ?? ""}
        placeholder="contact@monrestaurant.pf"
      />
      <Select
        name="merchant_open_status"
        label="Statut commerçant (manuel, 12 h)"
        defaultValue={initial?.merchant_open_status ?? ""}
        options={[
          { value: "", label: "— Non renseigné (utiliser Google si Place ID)" },
          { value: "open", label: "Ouvert maintenant" },
          { value: "closed", label: "Fermé pour l'instant" },
        ]}
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
