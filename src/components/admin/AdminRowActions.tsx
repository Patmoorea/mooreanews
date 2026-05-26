"use client";

import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { deleteContent, togglePublished } from "@/app/admin/actions";

type TableName =
  | "articles"
  | "events"
  | "announcements"
  | "restaurants"
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
  async function onToggle() {
    await togglePublished(table, id, published);
  }

  async function onDelete() {
    if (!confirm(`Supprimer ${itemLabel} ? Cette action est irréversible.`)) {
      return;
    }
    await deleteContent(table, id);
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        title={published ? "Dépublier" : "Publier"}
        className={`p-1.5 rounded-lg transition-colors ${
          published
            ? "text-tipanier-600 hover:bg-tipanier-50"
            : "text-ocean-400 hover:bg-ocean-50"
        }`}
      >
        {published ? <Eye size={16} /> : <EyeOff size={16} />}
      </button>
      <Link
        href={editHref}
        title="Éditer"
        className="p-1.5 rounded-lg text-lagon-600 hover:bg-lagon-50"
      >
        <Pencil size={16} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        title="Supprimer"
        className="p-1.5 rounded-lg text-tiare-600 hover:bg-tiare-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
