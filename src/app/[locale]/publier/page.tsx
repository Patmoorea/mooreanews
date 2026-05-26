import { setRequestLocale, getTranslations } from "next-intl/server";
import { SubmitForm } from "@/components/SubmitForm";
import { Plus, Zap, Eye, Shield } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "submit" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function SubmitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "submit" });

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-hibiscus-500 via-sunset-500 to-hibiscus-600 text-white py-16 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 text-9xl opacity-20 select-none">
          🌺
        </div>
        <div className="mx-auto max-w-7xl px-4 relative">
          <Plus className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            {t("title")}
          </h1>
          <p className="text-white/90 text-lg max-w-2xl">{t("subtitle")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Zap, label: "Gratuit", desc: "Aucun frais de publication" },
            { icon: Eye, label: "Visible", desc: "Vu par toute l'île" },
            { icon: Shield, label: "Validé", desc: "Modération sous 24h" },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md p-4 text-center"
              >
                <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-lagoon-400 to-deep-700 flex items-center justify-center text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-semibold text-deep-900 text-sm">
                  {item.label}
                </div>
                <div className="text-xs text-muted">{item.desc}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <SubmitForm />
        </div>
      </div>
    </div>
  );
}
