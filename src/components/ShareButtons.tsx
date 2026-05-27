"use client";

import { Share2, Link2, Check } from "lucide-react";
import { useState } from "react";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";

type Props = {
  url: string;
  title: string;
  description?: string;
  variant?: "inline" | "compact";
};

/**
 * Boutons de partage social réutilisables (Facebook, WhatsApp, Email,
 * copier le lien). Côté client pour gérer la copie + retour visuel.
 */
export function ShareButtons({ url, title, description, variant = "inline" }: Props) {
  const [copied, setCopied] = useState(false);

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url,
  )}`;
  const waText = description ? `${title} — ${description}\n${url}` : `${title} — ${url}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `${description ?? ""}\n\n${url}`,
  )}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback : sélectionner / mode dégradé silencieux
    }
  }

  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-2"
          : "flex flex-col sm:flex-row sm:items-center gap-3"
      }
    >
      {!compact && (
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ocean-800">
          <Share2 size={16} />
          Partager
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1877F2] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          aria-label="Partager sur Facebook"
        >
          <FacebookIcon size={14} />
          Facebook
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          aria-label="Partager sur WhatsApp"
        >
          <WhatsAppIcon size={14} />
          WhatsApp
        </a>
        <a
          href={mailHref}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ocean-100 text-ocean-800 text-sm font-semibold hover:bg-ocean-200 transition-colors"
          aria-label="Partager par email"
        >
          Email
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-lagon-100 text-ocean-800 text-sm font-semibold hover:bg-lagon-200 transition-colors"
          aria-label="Copier le lien"
        >
          {copied ? (
            <>
              <Check size={14} />
              Copié !
            </>
          ) : (
            <>
              <Link2 size={14} />
              Lien
            </>
          )}
        </button>
      </div>
    </div>
  );
}
