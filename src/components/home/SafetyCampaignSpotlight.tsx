"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Car, Heart, Waves, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { SiteCampaign } from "@/lib/site-campaigns";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "mooreanews-campaign-dismissed:";

function highlightIcon(kind: SiteCampaign["highlights"][number]["icon"]) {
  switch (kind) {
    case "route":
      return Car;
    case "ocean":
      return Waves;
    case "heart":
      return Heart;
  }
}

type Props = {
  campaign: SiteCampaign;
};

export function SafetyCampaignSpotlight({ campaign }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${campaign.id}`;
    setVisible(localStorage.getItem(key) !== "1");
  }, [campaign.id]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(`${STORAGE_PREFIX}${campaign.id}`, "1");
    setVisible(false);
  }

  return (
    <section
      id="campagne-securite"
      aria-labelledby="safety-campaign-title"
      className="relative overflow-hidden border-y border-ocean-900/10 bg-gradient-to-br from-[#0c1f33] via-[#1a0f12] to-[#0a2540]"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_30%,#dc2626_0%,transparent_45%),radial-gradient(circle_at_80%_60%,#0284c7_0%,transparent_40%)]"
      />

      <Container className="relative z-10 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:gap-12 lg:items-center">
          <div className="text-white">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white/90">
              <Heart size={14} className="text-red-400" aria-hidden />
              Campagne sécurité · Tahiti &amp; Moorea
            </p>

            <h2
              id="safety-campaign-title"
              className="mt-4 font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight text-balance"
            >
              {campaign.title}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-white/80 max-w-xl text-pretty">
              {campaign.subtitle}
            </p>

            <ul className="mt-6 space-y-3">
              {campaign.highlights.map((item) => {
                const Icon = highlightIcon(item.icon);
                return (
                  <li
                    key={item.text}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lagon-300">
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="text-sm sm:text-base text-white/90 leading-snug">
                      {item.text}
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 text-sm text-white/60 italic">
              Prenez soin de vous. Chaque semaine, une vie s&apos;arrête trop tôt
              — sur la route ou en mer.
            </p>
          </div>

          <figure className="relative mx-auto w-full max-w-[380px] lg:max-w-none">
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border border-white/15",
                "bg-black/30 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.75)]",
              )}
            >
              <Image
                src={campaign.imageSrc}
                alt={campaign.imageAlt}
                width={1080}
                height={1350}
                priority
                sizes="(max-width: 1024px) 90vw, 380px"
                className="h-auto w-full object-contain"
              />
            </div>
            <figcaption className="sr-only">{campaign.imageAlt}</figcaption>
          </figure>
        </div>
      </Container>

      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 z-20 rounded-full border border-white/20 bg-black/30 p-2 text-white/80 hover:bg-black/50 hover:text-white transition-colors"
        aria-label="Masquer cette campagne"
      >
        <X size={18} />
      </button>
    </section>
  );
}
