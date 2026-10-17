/**
 * Image garde week-end aux couleurs de MooreaNews (1080×1350, Satori / next/og).
 * Palette lagon / océan / tiare et polices Marcellus + Inter du site, logo MooreaNews.
 * Données : tour de garde officiel (Conseil de l'Ordre des médecins de Polynésie française).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { SITE } from "@/lib/constants";

const POSTER_SIZE = { width: 1080, height: 1350 } as const;

// Couleurs de src/app/globals.css
const OCEAN_950 = "#082f49";
const OCEAN_900 = "#0c4a6e";
const OCEAN_700 = "#0369a1";
const OCEAN_100 = "#e0f2fe";
const OCEAN_50 = "#f0f9ff";
const LAGON_500 = "#06b6d4";
const TIARE_500 = "#f43f5e";
const TIARE_600 = "#e11d48";
const WHITE = "#ffffff";

export const GARDE_OFFICIAL_SOURCE_LABEL =
  "Tour de garde officiel — Conseil de l'Ordre des médecins de Polynésie française";

export function posterHasDisplayContent(snap: GardeMooreaSnapshot): boolean {
  return Boolean(snap.doctor?.name);
}

function formatDoctorDisplay(name: string): string {
  return `Dr ${name.replace(/^Dr\.?\s+/i, "").trim()}`;
}

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function HoursRow({ day, hours }: { day: string; hours?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "18px 26px",
        borderRadius: 22,
        background: OCEAN_50,
        border: `2px solid ${OCEAN_100}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: OCEAN_950 }}>
        {cap(day)}
      </div>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: OCEAN_700 }}>
        {hours ?? "—"}
      </div>
    </div>
  );
}

export function GardeWeekendPosterElement({
  snap,
  logoSrc,
}: {
  snap: GardeMooreaSnapshot;
  logoSrc?: string;
}) {
  const doctor = snap.doctor;
  const sameDay = snap.validFrom === snap.validTo;
  const phone = doctor?.phone && doctor.phone !== "—" ? doctor.phone : null;

  return (
    <div
      style={{
        width: POSTER_SIZE.width,
        height: POSTER_SIZE.height,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter",
        background: `linear-gradient(160deg, ${LAGON_500} 0%, ${OCEAN_700} 55%, ${OCEAN_950} 100%)`,
        padding: 56,
      }}
    >
      {/* En-tête marque */}
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- Satori
          <img src={logoSrc} width={96} height={96} style={{ borderRadius: 48, border: `4px solid ${WHITE}` }} alt="" />
        ) : null}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 50, color: WHITE }}>
            MooreaNews
          </div>
          <div style={{ display: "flex", fontSize: 24, color: OCEAN_100 }}>
            L&apos;info de Moorea
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          marginTop: 44,
          fontFamily: "Marcellus",
          fontSize: 76,
          lineHeight: 1.05,
          color: WHITE,
        }}
      >
        Médecin de garde
      </div>
      <div style={{ display: "flex", marginTop: 8, fontSize: 36, fontWeight: 700, color: OCEAN_100 }}>
        {`Moorea · ${snap.label}`}
      </div>

      {/* Carte principale */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          marginTop: 40,
          padding: 44,
          borderRadius: 40,
          background: WHITE,
          gap: 22,
          boxShadow: "0 20px 50px rgba(8,47,73,0.35)",
        }}
      >
        <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 62, color: OCEAN_950 }}>
          {doctor?.name ? formatDoctorDisplay(doctor.name) : "Médecin non communiqué"}
        </div>
        {snap.doctorAddress ? (
          <div style={{ display: "flex", fontSize: 28, color: OCEAN_900 }}>{snap.doctorAddress}</div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <HoursRow day={dayLabel(snap.validFrom)} hours={snap.doctorHours?.saturday} />
          {!sameDay ? (
            <HoursRow day={dayLabel(snap.validTo)} hours={snap.doctorHours?.sunday} />
          ) : null}
        </div>
        {phone ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 8,
              padding: "20px 44px",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${TIARE_500}, ${TIARE_600})`,
              color: WHITE,
              fontSize: 56,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            {`☎ ${phone}`}
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 30, color: TIARE_600, fontWeight: 700 }}>
            Numéro non communiqué — DSP 40 47 01 44
          </div>
        )}
      </div>

      {/* Pharmacies : absentes du tableau officiel des médecins → pas affichées ici (aucune donnée non vérifiée). */}
      <div style={{ display: "flex", marginTop: 30, fontSize: 28, color: WHITE }}>
        Urgence vitale : appelez le 15
      </div>

      <div style={{ display: "flex", flex: 1 }} />

      {/* Pied */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 21, color: OCEAN_100 }}>
        <div style={{ display: "flex" }}>{`Source : ${GARDE_OFFICIAL_SOURCE_LABEL}`}</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontWeight: 700, color: WHITE }}>
            Urgences : SAMU 15 · Pompiers 18
          </div>
          <div style={{ display: "flex", fontWeight: 700, color: WHITE }}>
            {SITE.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    </div>
  );
}

export const GARDE_WEEKEND_POSTER_SIZE = POSTER_SIZE;

let assetsCache: Promise<{
  fonts: { name: string; data: Buffer; weight: 400 | 700 | 800; style: "normal" }[];
  logoSrc?: string;
}> | null = null;

/** Polices du site (Marcellus + Inter) et logo, embarqués dans src/assets. */
export function loadGardePosterAssets() {
  if (!assetsCache) {
    const dir = path.join(process.cwd(), "src/assets");
    const font = (f: string) => readFile(path.join(dir, "fonts", f));
    assetsCache = Promise.all([
      font("Marcellus-400.woff"),
      font("Inter-400.woff"),
      font("Inter-700.woff"),
      font("Inter-800.woff"),
      readFile(path.join(dir, "brand-logo.png")).catch(() => null),
    ]).then(([marc, i4, i7, i8, logo]) => ({
      fonts: [
        { name: "Marcellus", data: marc, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: i4, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: i7, weight: 700 as const, style: "normal" as const },
        { name: "Inter", data: i8, weight: 800 as const, style: "normal" as const },
      ],
      logoSrc: logo ? `data:image/png;base64,${logo.toString("base64")}` : undefined,
    }));
  }
  return assetsCache;
}

export async function renderGardeWeekendPosterPng(
  snap: GardeMooreaSnapshot,
): Promise<Buffer> {
  const { ImageResponse } = await import("next/og");
  const { fonts, logoSrc } = await loadGardePosterAssets();
  const res = new ImageResponse(GardeWeekendPosterElement({ snap, logoSrc }), {
    ...POSTER_SIZE,
    fonts,
  });
  return Buffer.from(await res.arrayBuffer());
}
