import { CATEGORIES } from "@/lib/constants";
import {
  Field,
  TextArea,
  Select,
  Checkbox,
  FormActions,
} from "@/components/admin/AdminFormFields";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import type { ArticleRow } from "@/lib/supabase/types";

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({
  value: c.slug,
  label: c.label,
}));

export function ArticleForm({
  action,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  initial?: ArticleRow | null;
}) {
  return (
    <form
      action={action}
      className="bg-white rounded-3xl border border-ocean-100 p-6 sm:p-8 space-y-5"
    >
      <ImageUploadField
        name="cover_url"
        defaultValue={initial?.cover_url}
        label="Photo / affiche"
        help="Image principale de l’article (affiche, photo d’illustration…)."
      />
      <Field
        name="title"
        label="Titre"
        required
        defaultValue={initial?.title}
        placeholder="Ex. Le marché de Pao Pao fait peau neuve"
      />
      <Field
        name="slug"
        label="Slug (URL)"
        defaultValue={initial?.slug}
        placeholder="auto-généré depuis le titre"
        help="Laisser vide pour générer automatiquement"
      />
      <TextArea
        name="excerpt"
        label="Résumé"
        required
        defaultValue={initial?.excerpt}
        rows={2}
        help="1-2 phrases pour la liste et le partage"
      />
      <TextArea
        name="body"
        label="Contenu"
        required
        defaultValue={initial?.body}
        rows={12}
        help="Texte simple, séparer les paragraphes par des sauts de ligne"
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Select
          name="category"
          label="Catégorie"
          required
          defaultValue={initial?.category ?? "actualites"}
          options={CATEGORY_OPTIONS}
        />
        <Field
          name="author"
          label="Auteur"
          defaultValue={initial?.author}
          placeholder="Ex. Équipe MooreaNews"
        />
      </div>
      <Field
        name="tags"
        label="Tags"
        defaultValue={initial?.tags?.join(", ")}
        placeholder="moorea, environnement, vie locale"
        help="Séparés par des virgules"
      />
      <div className="grid sm:grid-cols-2 gap-5 pt-2">
        <Checkbox
          name="published"
          label="Publié"
          defaultChecked={initial?.published ?? true}
          help="Décocher pour enregistrer en brouillon"
        />
        <Checkbox
          name="featured"
          label="À la une"
          defaultChecked={initial?.featured ?? false}
          help="Met en avant sur la page d'accueil"
        />
      </div>
      <FormActions cancelHref="/admin/articles" />
    </form>
  );
}
