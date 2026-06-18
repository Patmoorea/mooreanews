"use client";

import { Share2, Link2, Check } from "lucide-react";
import { useState } from "react";
import { FacebookIcon, WhatsAppIcon } from "@/components/ui/SocialIcons";
import { withUtm } from "@/lib/utm";

type Props = {
  url: string;
  title: string;
  description?: string;
  /** inline = défaut ; compact = petit ; article = WhatsApp mis en avant */
  variant?: "inline" | "compact" | "article";
  /** Identifiant campagne UTM (ex. slug article) */
  utmContent?: string;
};

export function ShareButtons({
  url,
  title,
  description,
  variant = "inline",
  utmContent,
}: Props) {
  const [copied, setCopied] = useState(false);

  const campaign = "partage_contenu";
  const waUrl = withUtm(url, {
    source: "whatsapp",
    medium: "social",
    campaign,
    content: utmContent,
  });
  const fbUrl = withUtm(url, {
    source: "facebook",
    medium: "social",
    campaign,
    content: utmContent,
  });

  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fbUrl)}`;
  const waText = description
    ? `${title} — ${description}\n${waUrl}`
    : `${title}\n${waUrl}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(waText)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
    `${description ?? ""}\n\n${waUrl}`,
  )}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(waUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (variant === "article") {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 text-base font-bold text-white shadow-lg shadow-[#25D366]/30 transition-transform hover:-translate-y-0.5 hover:bg-[#20bd5a]"
            aria-label="Partager sur WhatsApp"
          >
            <WhatsAppIcon size={24} />
            WhatsApp
          </a>
          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#1877F2] px-5 py-4 text-base font-bold text-white shadow-lg shadow-[#1877F2]/25 transition-transform hover:-translate-y-0.5 hover:bg-[#166fe5]"
            aria-label="Partager sur Facebook"
          >
            <FacebookIcon size={24} />
            Facebook
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ocean-500">
            <Share2 size={14} />
            Autres options
          </span>
          <a
            href={mailHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-ocean-100 px-3.5 py-2 text-sm font-semibold text-ocean-800 hover:bg-ocean-200"
          >
            Email
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-full bg-lagon-100 px-3.5 py-2 text-sm font-semibold text-ocean-800 hover:bg-lagon-200"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copié !
              </>
            ) : (
              <>
                <Link2 size={14} />
                Copier le lien
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const compact = variant === "compact";

  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-2"
          : "flex flex-col gap-3 sm:flex-row sm:items-center"
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
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-md hover:opacity-90"
          aria-label="Partager sur WhatsApp"
        >
          <WhatsAppIcon size={16} />
          WhatsApp
        </a>
        <a
          href={fbHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2] px-3.5 py-2 text-sm font-semibold text-white hover:opacity-90"
          aria-label="Partager sur Facebook"
        >
          <FacebookIcon size={14} />
          Facebook
        </a>
        <a
          href={mailHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-ocean-100 px-3.5 py-2 text-sm font-semibold text-ocean-800 hover:bg-ocean-200"
        >
          Email
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-full bg-lagon-100 px-3.5 py-2 text-sm font-semibold text-ocean-800 hover:bg-lagon-200"
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
