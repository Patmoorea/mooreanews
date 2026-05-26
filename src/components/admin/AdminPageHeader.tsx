import Link from "next/link";
import { Plus } from "lucide-react";

type Props = {
  title: string;
  description?: string;
  newHref?: string;
  newLabel?: string;
};

export function AdminPageHeader({
  title,
  description,
  newHref,
  newLabel = "Nouveau",
}: Props) {
  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl text-ocean-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ocean-600">{description}</p>
        )}
      </div>
      {newHref && (
        <Link
          href={newHref}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-br from-tiare-400 to-tiare-600 text-white text-sm font-semibold shadow-[var(--shadow-sunset)] hover:-translate-y-0.5 transition-transform"
        >
          <Plus size={16} />
          {newLabel}
        </Link>
      )}
    </header>
  );
}
