import { ExternalLink } from "lucide-react";
import { MOOREA_ASSOCIATIONS, MOOREA_COMMUNITY_LINKS } from "@/lib/constants";

export function CommunityLinks() {
  return (
    <section className="mt-12 bg-gradient-to-br from-ocean-50 to-lagon-50 rounded-3xl border border-ocean-100 p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ocean-950">
        Communauté & réseaux
      </h2>
      <p className="mt-2 text-sm text-ocean-700 max-w-2xl">
        MooreaNews agrège aussi les médias (RSS). Pour Facebook, ouvrez ces liens
        ou signalez une info via{" "}
        <a href="/soumettre" className="text-tiare-600 font-semibold hover:underline">
          Publier une info
        </a>
        .
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {MOOREA_COMMUNITY_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col h-full p-4 rounded-2xl bg-white border border-ocean-100 hover:border-tiare-300 hover:shadow-md transition-all"
            >
              <span className="font-semibold text-ocean-900 inline-flex items-center gap-2">
                {link.title}
                <ExternalLink size={14} className="text-ocean-400 shrink-0" />
              </span>
              <span className="mt-1 text-sm text-ocean-600">{link.description}</span>
            </a>
          </li>
        ))}
      </ul>

      {MOOREA_ASSOCIATIONS.length > 0 && (
        <>
          <h3 className="mt-10 font-display text-xl text-ocean-950">
            Associations & collectifs
          </h3>
          <p className="mt-2 text-sm text-ocean-700 max-w-2xl">
            Culture, lagon, jeunesse, environnement : acteurs locaux à suivre ou
            contacter. La commune recense plus de 500 associations sur l’île.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {MOOREA_ASSOCIATIONS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col h-full p-4 rounded-2xl bg-white border border-ocean-100 hover:border-tiare-300 hover:shadow-md transition-all"
                >
                  <span className="font-semibold text-ocean-900 inline-flex items-center gap-2">
                    {link.title}
                    <ExternalLink size={14} className="text-ocean-400 shrink-0" />
                  </span>
                  <span className="mt-1 text-sm text-ocean-600">
                    {link.description}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
