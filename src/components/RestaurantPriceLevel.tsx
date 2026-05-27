import { getRestaurantPriceLevelDisplay } from "@/lib/content-labels";

type Props = {
  level: 1 | 2 | 3 | 4;
  /** 4 pastilles (détail) ou seulement les pastilles remplies (liste) */
  variant?: "full" | "compact";
  className?: string;
};

export function RestaurantPriceLevel({
  level,
  variant = "compact",
  className = "",
}: Props) {
  const { filled, label, ariaLabel, title } = getRestaurantPriceLevelDisplay(level);
  const count = variant === "full" ? 4 : filled;

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-semibold ${className}`}
      title={title}
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i < filled;
        return (
          <span
            key={i}
            className={active ? "text-tiare-500" : "text-ocean-200"}
            aria-hidden
          >
            ●
          </span>
        );
      })}
      <span className="sr-only">{label}</span>
    </span>
  );
}
