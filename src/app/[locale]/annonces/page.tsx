import { setRequestLocale, getTranslations } from "next-intl/server";
import { getAnnouncements } from "@/lib/content";
import { Megaphone, MapPin, Phone, Calendar } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("announcements") };
}

const categoryColors: Record<string, string> = {
  vente: "bg-hibiscus-100 text-hibiscus-700",
  logement: "bg-lagoon-100 text-lagoon-700",
  service: "bg-palm-100 text-palm-700",
  animaux: "bg-sunset-100 text-sunset-700",
  emploi: "bg-deep-100 text-deep-700",
};

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const announcements = getAnnouncements();

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-sunset-500 via-sunset-600 to-hibiscus-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Megaphone className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            Annonces locales
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">
            Petites annonces de la communauté de Moorea : vente, logement,
            services, animaux et plus.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="space-y-4">
          {announcements.map((ann) => {
            const colorClass =
              categoryColors[ann.category] ?? "bg-deep-100 text-deep-700";
            return (
              <article
                key={ann.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5 group"
              >
                <div className="flex flex-wrap items-start gap-3 mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ${colorClass}`}
                  >
                    {ann.category}
                  </span>
                  <span className="ml-auto text-2xl font-display text-hibiscus-600">
                    {ann.price}
                  </span>
                </div>
                <h2 className="font-display text-xl text-deep-900 mb-2 group-hover:text-lagoon-700 transition-colors">
                  {ann.title}
                </h2>
                <p className="text-sm text-muted mb-4">{ann.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {ann.location}
                  </span>
                  <a
                    href={`tel:${ann.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1 text-lagoon-700 hover:text-lagoon-900 transition-colors font-medium"
                  >
                    <Phone className="h-3 w-3" />
                    {ann.phone}
                  </a>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(ann.date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
