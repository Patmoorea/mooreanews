import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE } from "@/lib/constants";

const PAGES = [
  "",
  "/evenements",
  "/annonces",
  "/restaurants",
  "/activites",
  "/infos",
  "/publier",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();

  return PAGES.flatMap((path) =>
    routing.locales.map((locale) => {
      const localizedPath =
        locale === routing.defaultLocale ? path : `/${locale}${path}`;
      return {
        url: `${base}${localizedPath || "/"}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: path === "" ? 1.0 : 0.7,
      };
    })
  );
}
