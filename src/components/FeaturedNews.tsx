import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/lib/content";

export function FeaturedNews({ articles }: { articles: Article[] }) {
  const t = useTranslations("sections.news");
  const tCommon = useTranslations("common");

  if (articles.length === 0) return null;

  const [first, ...rest] = articles;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-background to-sand-50">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl text-deep-900 mb-2">
              {t("title")}
            </h2>
            <p className="text-muted">{t("subtitle")}</p>
          </div>
          <Link
            href={"/actualites" as never}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-lagoon-700 hover:text-lagoon-900 transition-colors"
          >
            {tCommon("viewAll")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {first && <ArticleCard article={first} featured />}
          {rest.slice(0, 2).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}
