import { Container } from "@/components/ui/Container";
import { PalmLeft, PalmRight, Hibiscus } from "@/components/decor/TropicalDecor";

type Props = {
  badge?: string;
  title: string;
  description?: string;
  variant?: "lagon" | "tiare" | "soleil" | "tipanier" | "ocean";
};

const variants = {
  lagon: "from-lagon-200/80 via-lagon-50 to-white",
  tiare: "from-tiare-200/70 via-tiare-50 to-white",
  soleil: "from-soleil-200/80 via-soleil-50 to-white",
  tipanier: "from-tipanier-200/70 via-tipanier-50 to-white",
  ocean: "from-ocean-200/80 via-ocean-50 to-white",
};

const badgeVariants = {
  lagon: "bg-lagon-200/90 text-lagon-800 border-lagon-300/50",
  tiare: "bg-tiare-200/90 text-tiare-700 border-tiare-300/50",
  soleil: "bg-soleil-200/90 text-soleil-700 border-soleil-300/50",
  tipanier: "bg-tipanier-200/90 text-tipanier-700 border-tipanier-300/50",
  ocean: "bg-ocean-200/90 text-ocean-800 border-ocean-300/50",
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
        className="absolute inset-0 bg-tapa opacity-50 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-hibiscus opacity-40 pointer-events-none"
      />
      <PalmLeft className="absolute -left-4 bottom-0 w-20 sm:w-28 text-tipanier-600/20 pointer-events-none hidden sm:block" />
      <PalmRight className="absolute -right-4 bottom-0 w-24 sm:w-32 text-tipanier-700/15 pointer-events-none hidden sm:block" />
      <Hibiscus className="absolute top-6 right-[15%] w-10 h-10 opacity-50 hidden md:block" />

      <Container className="relative">
        <div className="max-w-3xl">
          {badge && (
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest border ${badgeVariants[variant]}`}
            >
              <span aria-hidden>🌺</span>
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
