import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Smartphone,
  Apple,
  ExternalLink,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Télécharger l'app",
  description:
    "Installez MooreaNews sur votre téléphone : PWA, Android (APK) et iOS. Ferries, alertes et météo Moorea.",
};

export default function TelechargerPage() {
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
          Résumé quotidien (ferries, alertes, météo) puis le site complet en un
          clic. Voici les options disponibles aujourd&apos;hui.
        </p>

        <div className="mt-10 space-y-6">
          <section className="rounded-3xl bg-white border border-ocean-100 p-6 sm:p-8 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-lagon-100 text-lagon-700 flex items-center justify-center flex-shrink-0">
                <Smartphone size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-ocean-950">
                  Option 1 — Ajouter à l&apos;écran d&apos;accueil (PWA)
                </h2>
                <p className="mt-2 text-ocean-700 text-sm">
                  <strong>Gratuit, immédiat</strong>, sans App Store. Fonctionne
                  sur Android (Chrome) et iPhone (Safari).
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
                    ou le bandeau « Installer MooreaNews »
                  </li>
                  <li>
                    <strong>iPhone</strong> : Safari → partager □↑ → « Sur
                    l&apos;écran d&apos;accueil »
                  </li>
                </ul>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full bg-lagon-600 text-white text-sm font-semibold hover:bg-lagon-500"
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
                <Download size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-ocean-950">
                  Option 2 — App Android (APK)
                </h2>
                <p className="mt-2 text-ocean-700 text-sm">
                  Application native Capacitor, compilée depuis le projet
                  MooreaNews.{" "}
                  <strong>Pas encore sur Google Play</strong> — installation
                  manuelle (test / sideload).
                </p>
                <p className="mt-3 text-sm text-ocean-600">
                  Fichier après build sur votre Mac :
                </p>
                <code className="mt-2 block text-xs bg-ocean-50 rounded-xl p-3 text-ocean-800 break-all">
                  moorea-hub/apps/mooreanews-app/android/app/build/outputs/apk/debug/app-debug.apk
                </code>
                <p className="mt-3 text-sm text-ocean-700">
                  Build :{" "}
                  <code className="text-xs bg-ocean-50 px-1 rounded">
                    export JAVA_HOME=$(/usr/libexec/java_home -v 17)
                  </code>{" "}
                  puis{" "}
                  <code className="text-xs bg-ocean-50 px-1 rounded">
                    ./scripts/build-android.sh
                  </code>{" "}
                  dans <code className="text-xs">apps/mooreanews-app</code>.
                </p>
                <p className="mt-2 text-xs text-ocean-500">
                  Publication Play Store : voir{" "}
                  <code>PLAY_STORE.md</code> dans le dépôt (compte Google 25
                  USD).
                </p>
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
                  Option 3 — App iPhone / iPad (iOS)
                </h2>
                <p className="mt-2 text-ocean-700 text-sm">
                  Projet Xcode dans{" "}
                  <code className="text-xs bg-ocean-50 px-1 rounded">
                    apps/mooreanews-app/ios
                  </code>
                  . Nécessite <strong>Xcode complet</strong> (App Store) et
                  compte Apple Developer (99 USD/an) pour publier sur l&apos;App
                  Store.
                </p>
                <p className="mt-3 text-sm text-ocean-600">
                  En attendant : utilisez la PWA (option 1) sur Safari.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 rounded-2xl border border-lagon-200 bg-lagon-50/60 p-5 text-sm text-ocean-800">
          <p className="font-semibold text-ocean-950">En résumé</p>
          <ul className="mt-2 space-y-1">
            <li>
              <strong>Sur le site public</strong> : page{" "}
              <Link href="/app" className="text-lagon-700 font-semibold">
                /app
              </Link>{" "}
              + installation PWA
            </li>
            <li>
              <strong>Play Store / App Store</strong> : pas encore en ligne
            </li>
            <li>
              <strong>Code des apps</strong> : dépôt GitHub{" "}
              <code>apps/mooreanews-app/</code>
            </li>
          </ul>
          <a
            href={SITE.url}
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
