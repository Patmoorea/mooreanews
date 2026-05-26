import { setRequestLocale, getTranslations } from "next-intl/server";
import { Mail, MapPin } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { SITE } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("contact") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="tropical-bg min-h-screen">
      <div className="bg-gradient-to-br from-lagoon-700 via-deep-800 to-lagoon-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <Mail className="h-10 w-10 mb-4 opacity-80" />
          <h1 className="font-display text-4xl sm:text-5xl mb-2">
            Nous contacter
          </h1>
          <p className="text-white/85 text-lg max-w-2xl">
            Une question, une suggestion, une info à partager ? Nous sommes à
            votre écoute.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href={`mailto:${SITE.email}`}
            className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 group"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-lagoon-400 to-deep-700 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <Mail className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl text-deep-900 mb-1">Email</h2>
            <p className="text-sm text-muted mb-2">Réponse sous 48h</p>
            <p className="text-lagoon-700 font-medium">{SITE.email}</p>
          </a>

          <div className="block bg-white rounded-2xl shadow-md p-6">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-hibiscus-400 to-sunset-500 flex items-center justify-center text-white mb-4">
              <MapPin className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl text-deep-900 mb-1">
              Localisation
            </h2>
            <p className="text-sm text-muted">
              Moorea, Polynésie française
              <br />
              Île sœur de Tahiti
            </p>
          </div>

          <a
            href={SITE.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 group"
          >
            <div className="h-12 w-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <FacebookIcon className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl text-deep-900 mb-1">
              Facebook
            </h2>
            <p className="text-sm text-muted mb-2">
              Actualités quotidiennes et événements
            </p>
            <p className="text-lagoon-700 font-medium">@MooreaHub</p>
          </a>

          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 group"
          >
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
              <InstagramIcon className="h-6 w-6" />
            </div>
            <h2 className="font-display text-xl text-deep-900 mb-1">
              Instagram
            </h2>
            <p className="text-sm text-muted mb-2">Les plus belles photos</p>
            <p className="text-lagoon-700 font-medium">@mooreahub</p>
          </a>
        </div>
      </div>
    </div>
  );
}
