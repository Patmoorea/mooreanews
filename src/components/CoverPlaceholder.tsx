import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  alt: string;
  className?: string;
  label?: string;
};

/** Fond neutre quand aucune vraie photo n’est disponible (pas de stock photo trompeur). */
export function CoverPlaceholder({ alt, className, label }: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-lagon-100 via-ocean-50 to-soleil-100 text-ocean-600",
        className,
      )}
      role="img"
      aria-label={alt}
    >
      <ImageIcon size={32} className="opacity-40" aria-hidden />
      {label ? (
        <span className="text-xs font-medium text-ocean-500 px-4 text-center">
          {label}
        </span>
      ) : null}
    </div>
  );
}
