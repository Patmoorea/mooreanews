import { setRequestLocale } from "next-intl/server";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl text-deep-900 mb-6">
        Mentions légales
      </h1>
      <div className="prose prose-sm text-muted space-y-4">
        <p>
          Le site Moorea Hub est édité par un éditeur indépendant basé en
          Polynésie française. Les contenus publiés par les utilisateurs sont
          modérés avant mise en ligne.
        </p>
        <p>
          <strong>Directeur de publication :</strong> à compléter.
          <br />
          <strong>Hébergeur :</strong> Vercel Inc., 440 N Barranca Avenue, #4133,
          Covina, CA 91723, USA.
        </p>
        <p>
          <strong>Contact :</strong>{" "}
          <a href="mailto:contact@mooreanews.com" className="text-lagoon-700">
            contact@mooreanews.com
          </a>
        </p>
        <p>
          Toute reproduction, même partielle, est interdite sans accord écrit
          préalable. Les marques et logos cités appartiennent à leurs
          propriétaires respectifs.
        </p>
      </div>
    </div>
  );
}
