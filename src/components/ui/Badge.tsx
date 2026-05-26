import { cn } from "@/lib/utils";

type Variant =
  | "lagon"
  | "ocean"
  | "tiare"
  | "soleil"
  | "tipanier"
  | "couchant"
  | "neutral";

type Props = {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  icon?: React.ReactNode;
};

const variantClasses: Record<Variant, string> = {
  lagon: "bg-lagon-100 text-lagon-800 ring-1 ring-lagon-200",
  ocean: "bg-ocean-100 text-ocean-800 ring-1 ring-ocean-200",
  tiare: "bg-tiare-100 text-tiare-700 ring-1 ring-tiare-200",
  soleil: "bg-soleil-100 text-soleil-700 ring-1 ring-soleil-200",
  tipanier: "bg-tipanier-100 text-tipanier-700 ring-1 ring-tipanier-200",
  couchant: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  neutral: "bg-ocean-50 text-ocean-700 ring-1 ring-ocean-100",
};

export function Badge({
  children,
  variant = "lagon",
  className,
  icon,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
