import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, MapPin } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/icons/SocialIcons";
import { SITE } from "@/lib/constants";

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/evenements", label: t("nav.events") },
    { href: "/annonces", label: t("nav.announcements") },
    { href: "/restaurants", label: t("nav.restaurants") },
    { href: "/activites", label: t("nav.activities") },
    { href: "/infos", label: t("nav.info") },
    { href: "/publier", label: t("nav.submit") },
    { href: "/contact", label: t("nav.contact") },
  ];

  return (
    <footer className="relative mt-20 bg-gradient-to-b from-deep-900 via-deep-950 to-lagoon-950 text-white overflow-hidden">
      {/* Vague décorative en haut */}
      <svg
        viewBox="0 0 1440 80"
        className="absolute top-0 left-0 w-full h-12 fill-background -translate-y-px"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 80 C 240 20, 480 60, 720 40 C 960 20, 1200 60, 1440 30 L 1440 0 L 0 0 Z" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* À propos */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-lagoon-400 to-deep-700 flex items-center justify-center">
                <span className="text-white font-display text-2xl">M</span>
                <span className="absolute -top-1 -right-1 text-lg">🌺</span>
              </div>
              <div>
                <div className="font-display text-2xl">Moorea Hub</div>
                <div className="text-xs uppercase tracking-widest text-hibiscus-300">
                  L'île sœur en live
                </div>
              </div>
            </div>
            <p className="text-sm text-white/70 max-w-md mb-6">
              {t("footer.tagline")}
            </p>
            <div className="flex items-center gap-3">
              <a
                href={SITE.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-4 w-4" />
              </a>
              <a
                href={SITE.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-display text-lg mb-4 text-hibiscus-200">
              {t("footer.navigation")}
            </h3>
            <ul className="space-y-2 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg mb-4 text-hibiscus-200">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-lagoon-300" />
                <span>Moorea, Polynésie française</span>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {SITE.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Ligne de séparation polynésienne */}
        <div className="my-8 flex items-center gap-3 text-lagoon-300/30">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-lagoon-300/30 to-transparent" />
          <span className="text-xl">🌺</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-lagoon-300/30 to-transparent" />
        </div>

        {/* Mentions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>
            © {year} Moorea Hub · {t("footer.rights")}
          </div>
          <div className="flex items-center gap-4">
            <Link href="/legal" className="hover:text-white transition-colors">
              {t("footer.legal")}
            </Link>
            <Link
              href="/confidentialite"
              className="hover:text-white transition-colors"
            >
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
