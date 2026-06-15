"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { deleteContent, togglePublished } from "@/app/admin/actions";

type TableName =
  | "articles"
  | "events"
  | "announcements"
  | "restaurants"
  | "accommodations"
  | "activities"
  | "info_pratiques";

type Props = {
  table: TableName;
  id: string;
  editHref: string;
  published: boolean;
  itemLabel?: string;
};

export function AdminRowActions({
  table,
  id,
  editHref,
  published,
  itemLabel = "cet élément",
}: Props) {
  const router = useRouter();

  async function onToggle() {
    try {
      await togglePublished(table, id, published);
      router.refresh();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Impossible de changer l'état de publication.",
      );
    }
  }

  async function onDelete() {
    if (!confirm(`Supprimer ${itemLabel} ? Cette action est irréversible.`)) {
      return;
    }
    try {
      await deleteContent(table, id);
      router.refresh();
    } catch (e) {
      alert(
        e instanceof Error
          ? e.message
          : "Suppression impossible (droits ou connexion).",
      );
    }
  }

  return (
    <div className="inline-flex shrink-0 items-center justify-end gap-1">
      <button
        type="button"
        onClick={onToggle}
        title={published ? "Dépublier" : "Publier"}
        aria-label={published ? "Dépublier" : "Publier"}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors ${
          published
            ? "text-tipanier-700 bg-tipanier-50 hover:bg-tipanier-100"
            : "text-ocean-600 bg-ocean-50 hover:bg-ocean-100"
        }`}
      >
        {published ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <Link
        href={editHref}
        title="Éditer"
        aria-label="Éditer"
        className="inline-flex items-center justify-center p-1.5 rounded-lg text-lagon-700 bg-lagon-50 hover:bg-lagon-100"
      >
        <Pencil size={15} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        title="Supprimer"
        aria-label="Supprimer"
        className="inline-flex items-center justify-center p-1.5 rounded-lg text-white bg-tiare-600 hover:bg-tiare-700"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
