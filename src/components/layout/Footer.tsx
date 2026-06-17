import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { NAV_ITEMS, SITE, SOCIAL, USEFUL_LINKS, whatsappHref } from "@/lib/constants";
import { SITE_DIRECTORY } from "@/lib/site-directory";
import { NewsletterForm } from "@/components/NewsletterForm";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { Logo } from "@/components/ui/Logo";
import { getSiteLogo } from "@/lib/seasonal-theme";
import { WaveDivider } from "@/components/decor/TropicalDecor";
import { AdSponsorsStrip } from "@/components/ads/AdSponsorsStrip";
import type { AdSponsorStripItem } from "@/lib/ads-sponsors";

export function Footer({ sponsorItems = [] }: { sponsorItems?: AdSponsorStripItem[] }) {
  const logoSrc = getSiteLogo();

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
                Recevez le brief matinal (ferries, alertes, météo) et le récap
                hebdo des actus et bons plans de l&apos;île.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </Container>
      </div>

      {/* Bloc principal */}
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 sm:gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-3 group"
            >
              <Logo src={logoSrc} size={40} className="rounded-full shadow-lg" />
              <span className="font-display text-xl text-white">
                {SITE.name}
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ocean-200/80">
              {SITE.tagline}. Actualités, événements, services et infos
              pratiques de notre belle île, en un seul endroit.
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
                href={whatsappHref("Bonjour MooreaNews")}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-ocean-800 hover:bg-[#25D366] text-white flex items-center justify-center transition-colors"
              >
                <WhatsAppIcon size={18} />
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

          {/* Plan du site (catégories) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <h3 className="font-display text-lg text-white">Plan du site</h3>
            <div className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {SITE_DIRECTORY.map((category) => (
                <div key={category.id}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ocean-400 mb-1.5">
                    {category.title}
                  </p>
                  <ul className="space-y-1.5">
                    {category.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-ocean-200/80 hover:text-white transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
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

      <AdSponsorsStrip items={sponsorItems} />

      {/* Copyright */}
      <div className="border-t border-ocean-800/60">
        <Container className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ocean-300/70">
          <span>{SITE.copyright}</span>
          <span className="flex items-center gap-3">
            <Link href="/en" className="hover:text-white transition-colors">
              English guide
            </Link>
            <Link href="/telecharger" className="hover:text-white transition-colors">
              App mobile
            </Link>
          </span>
        </Container>
      </div>
    </footer>
  );
}
