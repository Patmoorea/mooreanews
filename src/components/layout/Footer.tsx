import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { NAV_ITEMS, SITE, SOCIAL, USEFUL_LINKS } from "@/lib/constants";
import { NewsletterForm } from "@/components/NewsletterForm";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { Logo } from "@/components/ui/Logo";
import { WaveDivider } from "@/components/decor/TropicalDecor";

export function Footer() {
  return (
    <footer className="relative mt-20 bg-gradient-to-b from-ocean-800 via-ocean-900 to-ocean-950 text-ocean-100">
      <WaveDivider className="absolute top-0 left-0 right-0 -translate-y-full text-lagon-100" flip />
      {/* Bloc newsletter */}
      <div className="border-b border-ocean-800/60">
        <Container className="py-12 sm:py-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl text-white leading-tight">
                Restez connecté à Moorea 🌴
              </h2>
              <p className="mt-3 text-ocean-200/90 max-w-md">
                Recevez une fois par semaine les actus, événements et bons plans
                de l&apos;île, directement dans votre boîte mail.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </Container>
      </div>

      {/* Bloc principal */}
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 group"
            >
              <Logo size={40} className="rounded-full shadow-lg" />
              <span className="font-display text-xl text-white">
                {SITE.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ocean-200/80">
              L&apos;info de Moorea et de la Polynésie française.
              Actualités, événements, services et infos pratiques de
              notre belle île, en un seul endroit.
            </p>
            <p className="mt-2 text-xs italic text-lagon-200/70">
              {SITE.motto}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-ocean-800 hover:bg-lagon-500 text-white flex items-center justify-center transition-colors"
              >
                <FacebookIcon size={18} />
              </a>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-ocean-800 hover:bg-tiare-500 text-white flex items-center justify-center transition-colors"
              >
                <InstagramIcon size={18} />
              </a>
              <a
                href={`mailto:${SITE.email}`}
                aria-label="Email"
                className="w-9 h-9 rounded-full bg-ocean-800 hover:bg-soleil-500 text-white flex items-center justify-center transition-colors"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-display text-lg text-white">Navigation</h3>
            <ul className="mt-4 space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-ocean-200/80 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Le site */}
          <div>
            <h3 className="font-display text-lg text-white">Le site</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/a-propos"
                  className="text-sm text-ocean-200/80 hover:text-white transition-colors"
                >
                  À propos
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-ocean-200/80 hover:text-white transition-colors"
                >
                  Nous contacter
                </Link>
              </li>
              <li>
                <Link
                  href="/recherche"
                  className="text-sm text-ocean-200/80 hover:text-white transition-colors"
                >
                  Recherche
                </Link>
              </li>
              <li>
                <Link
                  href="/soumettre"
                  className="text-sm text-tiare-300 hover:text-tiare-200 transition-colors font-medium"
                >
                  + Publier une info
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-sm text-ocean-300/70 hover:text-white transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentialite"
                  className="text-sm text-ocean-300/70 hover:text-white transition-colors"
                >
                  Confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-display text-lg text-white">Liens utiles</h3>
            <ul className="mt-4 space-y-2">
              {USEFUL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-ocean-200/80 hover:text-white transition-colors"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg text-white">Contact</h3>
            <address className="mt-4 not-italic space-y-3 text-sm text-ocean-200/80">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>Moorea, Polynésie française</span>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="mt-0.5 flex-shrink-0" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="hover:text-white transition-colors"
                >
                  {SITE.email}
                </a>
              </div>
            </address>
          </div>
        </div>
      </Container>

      {/* Copyright */}
      <div className="border-t border-ocean-800/60">
        <Container className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ocean-300/70">
          <span>{SITE.copyright}</span>
          <span>
            Fait avec{" "}
            <span className="text-tiare-400">♥</span> à Moorea, sous le soleil
            de Polynésie.
          </span>
        </Container>
      </div>
    </footer>
  );
}
