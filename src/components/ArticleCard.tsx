import Image from "next/image";
import { Calendar, User, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Article } from "@/lib/content";

export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/actualites/${article.slug}` as never}
      className={`group block overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-2xl transition-all ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          featured ? "aspect-[16/9]" : "aspect-[4/3]"
        }`}
      >
        <Image
          src={article.image}
          alt={article.title}
          fill
          sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 inline-block px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold text-deep-800">
          {article.category}
        </span>
        <div className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4 text-deep-900" />
        </div>
      </div>

      <div className="p-5">
        <h3
          className={`font-display text-deep-900 leading-tight group-hover:text-lagoon-700 transition-colors mb-2 ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {article.title}
        </h3>
        <p className="text-sm text-muted line-clamp-2 mb-4">{article.excerpt}</p>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="inline-flex items-center gap-1">
            <User className="h-3 w-3" />
            {article.author}
          </span>
        </div>
      </div>
    </Link>
  );
}
