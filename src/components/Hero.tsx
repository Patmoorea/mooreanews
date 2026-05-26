import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Plus } from "lucide-react";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-deep-900 via-lagoon-800 to-deep-700 text-white">
      {/* Image de fond lagon */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=2000&q=80")`,
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-deep-950/80 via-deep-900/40 to-transparent" />

      {/* Décoration flottante */}
      <div className="absolute top-12 right-12 text-6xl opacity-30 animate-float select-none hidden md:block">
        🌺
      </div>
      <div
        className="absolute bottom-12 left-12 text-5xl opacity-25 animate-float select-none hidden md:block"
        style={{ animationDelay: "2s" }}
      >
        🌴
      </div>
      <div
        className="absolute top-1/2 right-1/4 text-4xl opacity-20 animate-wave select-none hidden lg:block"
        style={{ animationDelay: "4s" }}
      >
        🐚
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-6 animate-fade-up">
            <span className="text-base">🌺</span>
            <span className="text-xs font-medium uppercase tracking-wider">
              {t("badge")}
            </span>
          </div>

          <h1
            className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mb-6 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            {t("title")}
          </h1>

          <p
            className="text-lg sm:text-xl text-white/85 max-w-2xl mb-10 leading-relaxed animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {t("subtitle")}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/publier"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-500 to-sunset-500 px-6 py-3.5 font-semibold text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              <Plus className="h-4 w-4" />
              {t("ctaSubmit")}
            </Link>
            <a
              href="#explore"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 px-6 py-3.5 font-semibold text-white hover:bg-white/20 transition-all"
            >
              {t("ctaExplore")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Vague en bas */}
      <svg
        viewBox="0 0 1440 100"
        className="absolute bottom-0 left-0 w-full h-12 fill-background"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 100 C 240 40, 480 80, 720 50 C 960 20, 1200 80, 1440 40 L 1440 100 L 0 100 Z" />
      </svg>
    </section>
  );
}
