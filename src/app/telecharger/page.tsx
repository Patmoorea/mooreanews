import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Smartphone,
  Apple,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ANDROID_APK, SITE } from "@/lib/constants";
import { staticPageMetadata } from "@/lib/seo";

export const metadata: Metadata = staticPageMetadata({
  title: "Télécharger l'app",
  description:
    "Téléchargez l'APK MooreaNews pour Android. PWA et iOS aussi disponibles. Ferries, alertes et météo Moorea.",
  path: "/telecharger",
});

export default function TelechargerPage() {
  const apkUrl = ANDROID_APK.href;

  return (
    <div className="min-h-screen bg-island-sky py-12 sm:py-16">
      <Container className="max-w-3xl">
        <p className="text-lagon-700 text-sm font-semibold uppercase tracking-widest">
          Mobile
        </p>
        <h1 className="font-display text-3xl sm:text-4xl text-ocean-950 mt-2">
          MooreaNews sur votre téléphone
        </h1>
        <p className="mt-4 text-ocean-700 text-lg">
          Ferries, alertes et météo en un coup d&apos;œil — puis le site complet
          en un clic.
        </p>

        {/* APK — mis en avant */}
        <section className="mt-10 rounded-3xl bg-gradient-to-br from-ocean-800 to-ocean-950 text-white p-6 sm:p-8 shadow-[var(--shadow-tropical)]">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Download size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl">App Android — téléchargement</h2>
              <p className="mt-2 text-ocean-200 text-sm">
                Version {ANDROID_APK.version} · Application MooreaNews (Capacitor)
              </p>
              <a
                href={apkUrl}
                download={ANDROID_APK.filename}
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 rounded-full bg-lagon-500 hover:bg-lagon-400 text-white font-semibold shadow-lg transition-colors"
              >
                <Download size={18} />
                Télécharger l&apos;APK Android
              </a>
              <p className="mt-4 text-xs text-ocean-300">
                Lien direct :{" "}
                <a
                  href={apkUrl}
                  className="underline hover:text-white break-all"
                >
                  {SITE.url.replace(/\/$/, "")}
                  {apkUrl}
                </a>
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-ocean-100">
            <p className="font-semibold text-white flex items-center gap-2">
              <ShieldAlert size={16} />
              Installation sur Android
            </p>
            <ol className="mt-2 space-y-1 list-decimal pl-5 text-ocean-200">
              <li>Téléchargez le fichier APK ci-dessus</li>
              <li>Ouvrez-le (Fichiers ou notification de téléchargement)</li>
              <li>
                Si demandé : Paramètres → autoriser l&apos;installation depuis
                cette source
              </li>
              <li>Installez, puis ouvrez MooreaNews</li>
            </ol>
            <p className="mt-3 text-xs text-ocean-300">
              APK de test (debug). Google Play à venir. L&apos;app charge le
              résumé quotidien puis mooreanews.com pour le détail.
            </p>
          </div>
        </section>

        <div className="mt-8 space-y-6">
          <section className="rounded-3xl bg-white border border-ocean-100 p-6 sm:p-8 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lagon-100 text-lagon-700 flex items-center justify-center flex-shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-ocean-950">
                  Alternative — PWA (écran d&apos;accueil)
                </h2>
                <p className="mt-2 text-ocean-700 text-sm">
                  Sans téléchargement APK. Idéal aussi sur iPhone.
                </p>
                <ul className="mt-4 space-y-2 text-sm text-ocean-800 list-disc pl-5">
                  <li>
                    Ouvrez{" "}
                    <Link href="/app" className="text-lagon-700 font-semibold hover:underline">
                      mooreanews.com/app
                    </Link>
                  </li>
                  <li>
                    <strong>Android</strong> : menu ⋮ → « Installer l&apos;application »
                  </li>
                  <li>
                    <strong>iPhone</strong> : Safari → partager → « Sur l&apos;écran
                    d&apos;accueil »
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full border border-ocean-200 text-ocean-800 text-sm font-semibold hover:border-lagon-400"
                >
                  Ouvrir l&apos;app web
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white border border-ocean-100 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-ocean-100 text-ocean-700 flex items-center justify-center flex-shrink-0">
                <Apple size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-ocean-950">
                  iPhone / iPad
                </h2>
                <p className="mt-2 text-ocean-700 text-sm">
                  App Store pas encore disponible. Utilisez la PWA ci-dessus sur
                  Safari.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-2xl border border-lagon-200 bg-lagon-50/60 p-5 text-sm text-ocean-800">
          <p className="font-semibold text-ocean-950">Liens utiles</p>
          <ul className="mt-2 space-y-1">
            <li>
              <a href={apkUrl} download className="text-lagon-700 font-semibold hover:underline">
                APK Android direct
              </a>
            </li>
            <li>
              <Link href="/app" className="text-lagon-700 font-semibold hover:underline">
                App web /app
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="text-lagon-700 font-semibold hover:underline">
                Politique de confidentialité
              </Link>
            </li>
          </ul>
          <a
            href="/"
            className="inline-flex items-center gap-1 mt-4 text-lagon-700 font-semibold hover:underline"
          >
            Retour à {SITE.name}
            <ExternalLink size={14} />
          </a>
        </div>
      </Container>
    </div>
  );
}
