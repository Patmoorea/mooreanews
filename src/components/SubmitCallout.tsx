import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Megaphone, ArrowRight } from "lucide-react";

export function SubmitCallout() {
  const t = useTranslations("sections.submit");

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-hibiscus-500 via-sunset-500 to-hibiscus-600 p-8 lg:p-12 text-white shadow-2xl">
          <div className="absolute -top-12 -right-12 text-9xl opacity-20 select-none">
            🌺
          </div>
          <div className="absolute -bottom-12 -left-12 text-9xl opacity-15 select-none">
            🌴
          </div>

          <div className="relative max-w-2xl">
            <Megaphone className="h-10 w-10 mb-4 opacity-90" />
            <h2 className="font-display text-3xl sm:text-4xl mb-3">
              {t("title")}
            </h2>
            <p className="text-lg text-white/90 mb-6">{t("subtitle")}</p>
            <Link
              href="/publier"
              className="group inline-flex items-center gap-2 rounded-full bg-white text-hibiscus-600 px-6 py-3 font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
