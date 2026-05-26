import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Calendar, Megaphone, UtensilsCrossed, Mountain, Info } from "lucide-react";

export function CategoryGrid() {
  const t = useTranslations("sections.categories");

  const categories = [
    {
      href: "/evenements",
      title: t("events"),
      icon: Calendar,
      gradient: "from-hibiscus-400 to-hibiscus-600",
      emoji: "🎉",
    },
    {
      href: "/annonces",
      title: t("announcements"),
      icon: Megaphone,
      gradient: "from-sunset-400 to-sunset-600",
      emoji: "📢",
    },
    {
      href: "/restaurants",
      title: t("restaurants"),
      icon: UtensilsCrossed,
      gradient: "from-palm-400 to-palm-600",
      emoji: "🍴",
    },
    {
      href: "/activites",
      title: t("activities"),
      icon: Mountain,
      gradient: "from-lagoon-400 to-lagoon-600",
      emoji: "🏝️",
    },
    {
      href: "/infos",
      title: t("info"),
      icon: Info,
      gradient: "from-deep-400 to-deep-700",
      emoji: "ℹ️",
    },
  ];

  return (
    <section id="explore" className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="font-display text-3xl sm:text-4xl text-deep-900 text-center mb-3">
          {t("title")}
        </h2>
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="h-px w-12 bg-lagoon-300" />
          <span className="text-2xl">🌺</span>
          <div className="h-px w-12 bg-lagoon-300" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.href}
                href={cat.href as never}
                className="group relative overflow-hidden rounded-2xl aspect-square shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${cat.gradient}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute top-3 right-3 text-3xl group-hover:scale-125 transition-transform">
                  {cat.emoji}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <Icon className="h-5 w-5 mb-2 opacity-90" />
                  <div className="font-display text-lg leading-tight">
                    {cat.title}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
