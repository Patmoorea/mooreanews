/**
 * Affiche récap semaine MooreaNews — charte lagon / océan (sans vert).
 */

import type { WeeklyRecapSnapshot } from "@/lib/weekly-recap-data";
import { SITE } from "@/lib/constants";
import {
  POSTER,
  posterBackground,
  posterBadgeGradient,
  posterCardStyle,
  posterLogoGradient,
  PosterPolynesianScenery,
} from "@/lib/poster-brand";

const POSTER_SIZE = { width: 1080, height: 1350 } as const;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function ListRow({ prefix, text }: { prefix: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        padding: "10px 14px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.94)",
        border: "1px solid rgba(0,194,215,0.25)",
        boxShadow: "0 4px 16px rgba(8,59,102,0.1)",
        marginBottom: 8,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: POSTER.lagon,
          minWidth: 72,
          display: "flex",
        }}
      >
        {prefix}
      </div>
      <div
        style={{ fontSize: 15, fontWeight: 700, color: POSTER.ocean, display: "flex", flex: 1 }}
      >
        {truncate(text, 72)}
      </div>
    </div>
  );
}

export function WeeklyRecapPosterElement({ snap }: { snap: WeeklyRecapSnapshot }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: posterBackground(),
        color: POSTER.white,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      <PosterPolynesianScenery />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "26px 36px 12px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              background: posterLogoGradient(),
              color: POSTER.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 900,
              marginRight: 12,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: POSTER.white, display: "flex" }}>
              MooreaNews
            </div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: 2,
                fontWeight: 700,
                color: POSTER.lagonLight,
                display: "flex",
              }}
            >
              Agenda & actu de la semaine
            </div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: POSTER.lagonLight, opacity: 0.95, display: "flex" }}>
          Ia ora na !
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 36px 16px",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: POSTER.white,
            background: posterBadgeGradient(),
            padding: "8px 28px",
            borderRadius: 999,
            display: "flex",
          }}
        >
          Votre semaine à Moorea
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            marginTop: 12,
            color: POSTER.soleil,
            display: "flex",
          }}
        >
          {snap.label}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "0 32px 12px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {snap.events.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 14 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: POSTER.white,
                marginBottom: 8,
                display: "flex",
              }}
            >
              Événements
            </div>
            {snap.events.slice(0, 5).map((e) => (
              <ListRow
                key={e.slug}
                prefix={e.date}
                text={`${e.title}${e.time ? ` · ${e.time}` : ""} · ${e.location}`}
              />
            ))}
          </div>
        )}

        {snap.articles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: POSTER.white,
                marginBottom: 8,
                display: "flex",
              }}
            >
              Actualités
            </div>
            {snap.articles.slice(0, 5).map((a) => (
              <ListRow key={a.slug} prefix="Actu" text={a.title} />
            ))}
          </div>
        )}

        {snap.events.length === 0 && snap.articles.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 32,
              ...posterCardStyle(),
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900, color: POSTER.ocean, display: "flex" }}>
              Semaine en cours sur Moorea
            </div>
            <div
              style={{ fontSize: 16, marginTop: 10, display: "flex", color: POSTER.slate }}
            >
              Retrouvez l&apos;agenda et les actus sur mooreanews.com
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          padding: "16px 36px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(255,255,255,0.94)",
          borderTop: `4px solid ${POSTER.sandWarm}`,
          boxShadow: "0 -8px 30px rgba(8,59,102,0.12)",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: POSTER.ocean }}>
            Agenda complet sur MooreaNews
          </div>
          <div style={{ display: "flex", fontSize: 13, color: POSTER.slate, marginTop: 4 }}>
            Événements · Annonces · Alertes ferry
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: POSTER.lagon }}>
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>
  );
}

export const WEEKLY_RECAP_POSTER_SIZE = POSTER_SIZE;

export async function renderWeeklyRecapPosterPng(
  snap: WeeklyRecapSnapshot,
): Promise<Buffer> {
  const { ImageResponse } = await import("next/og");
  const res = new ImageResponse(WeeklyRecapPosterElement({ snap }), POSTER_SIZE);
  return Buffer.from(await res.arrayBuffer());
}
