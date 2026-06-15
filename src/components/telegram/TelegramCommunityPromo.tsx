import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Megaphone,
  Radio,
  Send,
  Smartphone,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  getPublicBotUrl,
  getPublicBotUsername,
  getPublicChannelUrl,
  getPublicChannelUsername,
} from "@/lib/telegram-config";

type Variant = "hero" | "page" | "compact";

type Props = {
  variant?: Variant;
  /** Mettre en avant l’app mobile (page téléchargement). */
  mobileFocus?: boolean;
};

export function TelegramCommunityPromo({
  variant = "hero",
  mobileFocus = false,
}: Props) {
  const botUrl = getPublicBotUrl();
  const botUser = getPublicBotUsername();
  const channelUrl = getPublicChannelUrl();
  const channelUser = getPublicChannelUsername();

  if (variant === "compact") {
    return (
      <div className="rounded-2xl bg-lagon-50 border border-lagon-200 p-4 sm:p-5 text-sm text-ocean-700 space-y-3">
        <p className="font-semibold text-ocean-900">
          Telegram — @{botUser}
          {channelUser ? ` · Canal @${channelUser}` : ""}
        </p>
        <p>
          <strong>/start</strong> sur le bot pour signaler (photo + catégorie).
          Le canal publie les actus. Modération avant alerte push.
        </p>
        <ActionButtons botUrl={botUrl} channelUrl={channelUrl} size="sm" />
        <CrossLinks />
      </div>
    );
  }

  const inner = (
    <div
      className={
        variant === "hero"
          ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#229ED9] via-lagon-700 to-ocean-900 p-6 sm:p-8 lg:p-10 text-white shadow-[var(--shadow-tropical)]"
          : "rounded-3xl bg-gradient-to-br from-ocean-800 to-ocean-950 p-6 sm:p-8 text-white border border-ocean-700/50"
      }
    >
      {variant === "hero" && (
        <>
          <div
            aria-hidden
            className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -left-20 bottom-0 w-64 h-64 rounded-full bg-lagon-400/20 blur-3xl"
          />
        </>
      )}

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-lagon-200">
          {mobileFocus ? "Sur mobile" : "Communauté"} · Alertes & Telegram
        </p>
        <h2
          className={
            variant === "hero"
              ? "mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-balance"
              : "mt-2 font-display text-xl sm:text-2xl"
          }
        >
          {mobileFocus
            ? "Alertes push, signalements et actus — sur le site ou Telegram"
            : "Recevoir, signaler, suivre l’info de Moorea"}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-ocean-100 max-w-2xl text-pretty">
          {mobileFocus ? (
            <>
              Installez l&apos;app ou la PWA, activez les{" "}
              <strong>alertes par quartier</strong>, ou utilisez{" "}
              <strong>@{botUser}</strong> pour envoyer une info avec photo.
              Abonnez-vous au canal pour les actus.
            </>
          ) : (
            <>
              Trois usages simples : être alerté (push ou email), signaler une
              situation locale (web ou bot), lire les actus sur le canal public.
              Tout est modéré avant publication.
            </>
          )}
        </p>

        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          <Step
            icon={<Bell size={20} />}
            title="1. Recevoir les alertes"
            desc="Coupures, ferry, météo, route — choisissez vos quartiers, push ou email."
            href="/alertes"
            cta="Page Alertes →"
          />
          <Step
            icon={<Send size={20} />}
            title="2. Signaler une info"
            desc="Accident, baleines, incendie, ferry… Formulaire web ou bot /start + photo."
            href="/signalements"
            cta="Signalements →"
          />
          <Step
            icon={<Radio size={20} />}
            title="3. Suivre les actus"
            desc={
              channelUser
                ? `Canal @${channelUser} : articles et infos de l’île.`
                : "Canal Telegram MooreaNews : actus de l’île."
            }
            href={channelUrl ?? botUrl}
            external={Boolean(channelUrl)}
            cta={channelUser ? `Canal @${channelUser}` : "Canal Telegram"}
          />
        </ol>

        <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
          <ActionButtons botUrl={botUrl} channelUrl={channelUrl} size="md" />
          {mobileFocus && (
            <Link
              href="/telecharger"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/15 border border-white/25 text-white text-sm font-semibold hover:bg-white/25"
            >
              <Smartphone size={16} />
              Télécharger l&apos;app
            </Link>
          )}
        </div>

        <p className="mt-4 text-xs text-ocean-200">
          Urgence vitale : <strong>15</strong> ou secours — pas via Telegram.
          Bot : <strong>@{botUser}</strong>
          {channelUser ? (
            <>
              {" "}
              · Canal : <strong>@{channelUser}</strong>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );

  if (variant === "hero") {
    return (
      <section className="py-8 sm:py-10 bg-gradient-to-b from-lagon-50/40 to-transparent">
        <Container>{inner}</Container>
      </section>
    );
  }

  return inner;
}

function Step({
  icon,
  title,
  desc,
  href,
  cta,
  external,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  href: string;
  cta: string;
  external?: boolean;
}) {
  const className =
    "block rounded-2xl bg-white/10 border border-white/15 p-4 hover:bg-white/15 transition-colors h-full";
  const content = (
    <>
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-soleil-200 mb-3">
        {icon}
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="mt-1 text-xs text-ocean-200 leading-relaxed">{desc}</p>
      <span className="mt-3 inline-block text-xs font-bold text-lagon-200">
        {cta}
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function ActionButtons({
  botUrl,
  channelUrl,
  size,
}: {
  botUrl: string;
  channelUrl?: string;
  size: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-4 py-2 text-sm" : "px-5 py-2.5 text-sm";
  return (
    <>
      <a
        href={botUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-full bg-white text-[#229ED9] font-semibold hover:bg-lagon-50 ${pad}`}
      >
        <Megaphone size={16} />
        Bot @{getPublicBotUsername()}
      </a>
      {channelUrl && (
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 text-white font-semibold hover:bg-white/25 ${pad}`}
        >
          <Radio size={16} />
          Canal actualités
        </a>
      )}
      <Link
        href="/alertes"
        className={`inline-flex items-center gap-2 rounded-full bg-soleil-500 text-ocean-950 font-semibold hover:bg-soleil-400 ${pad}`}
      >
        <Bell size={16} />
        Alertes quartier
      </Link>
      <Link
        href="/signalements"
        className={`inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/30 text-white font-semibold hover:bg-white/25 ${pad}`}
      >
        <Send size={16} />
        Signaler
      </Link>
    </>
  );
}

function CrossLinks() {
  return (
    <p className="text-xs text-ocean-600">
      <Link href="/alertes" className="text-lagon-700 font-semibold hover:underline">
        Recevoir les alertes
      </Link>
      {" · "}
      <Link href="/signalements" className="text-lagon-700 font-semibold hover:underline">
        Formulaire signalement
      </Link>
      {" · "}
      <Link href="/telecharger" className="text-lagon-700 font-semibold hover:underline">
        App mobile
      </Link>
    </p>
  );
}
