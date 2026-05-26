import { setRequestLocale, getTranslations } from "next-intl/server";
import { getPracticalInfo } from "@/lib/content";
import { Info, Phone, ExternalLink } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("info") };
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sections = getPracticalInfo();

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-deep-700 via-deep-800 to-deep-950 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Info className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            Infos pratiques
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">
            Tout ce qu'il faut savoir pour vivre ou visiter Moorea : transports,
            santé, administration, urgences.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 space-y-10">
        {sections.map((section) => (
          <section key={section.slug}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{section.icon}</span>
              <h2 className="font-display text-2xl sm:text-3xl text-deep-900">
                {section.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md p-5 hover:shadow-xl transition-all"
                >
                  <h3 className="font-display text-lg text-deep-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted mb-3">{item.content}</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {item.phone && item.phone !== "—" && (
                      <a
                        href={`tel:${item.phone.replace(/\s/g, "")}`}
                        className="inline-flex items-center gap-1.5 text-lagoon-700 hover:text-lagoon-900 transition-colors font-medium"
                      >
                        <Phone className="h-3 w-3" />
                        {item.phone}
                      </a>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-hibiscus-600 hover:text-hibiscus-800 transition-colors font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Site web
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
