import { Container } from "@/components/ui/Container";

type Props = {
  badge?: string;
  title: string;
  description?: string;
  variant?: "lagon" | "tiare" | "soleil" | "tipanier" | "ocean";
};

const variants = {
  lagon: "from-lagon-100 via-lagon-50 to-white",
  tiare: "from-tiare-100 via-tiare-50 to-white",
  soleil: "from-soleil-100 via-soleil-50 to-white",
  tipanier: "from-tipanier-100 via-tipanier-50 to-white",
  ocean: "from-ocean-100 via-ocean-50 to-white",
};

const badgeVariants = {
  lagon: "bg-lagon-200 text-lagon-800",
  tiare: "bg-tiare-200 text-tiare-700",
  soleil: "bg-soleil-200 text-soleil-700",
  tipanier: "bg-tipanier-200 text-tipanier-700",
  ocean: "bg-ocean-200 text-ocean-800",
};

export function PageHeader({
  badge,
  title,
  description,
  variant = "lagon",
}: Props) {
  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-b ${variants[variant]} py-14 sm:py-20`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-tapa opacity-40 pointer-events-none"
      />
      <Container className="relative">
        <div className="max-w-3xl">
          {badge && (
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${badgeVariants[variant]}`}
            >
              {badge}
            </span>
          )}
          <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl text-balance text-ocean-950 leading-[1.1]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-lg text-ocean-700 max-w-2xl text-pretty">
              {description}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
