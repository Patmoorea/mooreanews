import { setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl text-deep-900 mb-6">
        Politique de confidentialité
      </h1>
      <div className="prose prose-sm text-muted space-y-4">
        <p>
          Moorea Hub respecte votre vie privée. Cette page décrit les données
          collectées et leur utilisation.
        </p>
        <h2 className="font-display text-xl text-deep-900 pt-4">
          Données collectées
        </h2>
        <p>
          Lors d'une soumission, nous collectons : votre nom, email, téléphone
          (optionnel) et le contenu de votre publication. Ces données ne sont
          utilisées que pour la validation et la publication de votre contenu.
        </p>
        <h2 className="font-display text-xl text-deep-900 pt-4">Cookies</h2>
        <p>
          Aucun cookie de suivi tiers. Nous utilisons uniquement les cookies
          techniques nécessaires au fonctionnement du site.
        </p>
        <h2 className="font-display text-xl text-deep-900 pt-4">Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de
          rectification et de suppression de vos données. Pour exercer ces
          droits, contactez-nous à{" "}
          <a href="mailto:contact@mooreanews.com" className="text-lagoon-700">
            contact@mooreanews.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
