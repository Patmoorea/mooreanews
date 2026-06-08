/**
 * Affiche récap semaine — visuel type flyer (couleurs, motifs, cartes).
 */

import type { ReactNode } from "react";
import type { WeeklyRecapSnapshot } from "@/lib/weekly-recap-data";
import { SITE } from "@/lib/constants";
import {
  POSTER,
  posterBackground,
  posterBadgeGradient,
  posterLogoGradient,
} from "@/lib/poster-brand";

const WIDTH = 1080;

function stripEmoji(s: string): string {
  return s
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function truncate(s: string, max: number): string {
  const t = stripEmoji(s);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function weeklyRecapPosterSize(snap: WeeklyRecapSnapshot): {
  width: number;
  height: number;
} {
  const eventRows = snap.events.length > 0 ? Math.min(snap.events.length, 6) : 0;
  const articleRows = snap.articles.length > 0 ? Math.min(snap.articles.length, 6) : 0;
  const empty = eventRows === 0 && articleRows === 0;

  let h = 400;
  if (eventRows > 0) h += 52 + eventRows * 48;
  if (articleRows > 0) h += 52 + articleRows * 48;
  if (eventRows > 0 && articleRows > 0) h += 16;
  if (empty) h += 100;

  return { width: WIDTH, height: Math.min(Math.max(h, 620), 1050) };
}

function PosterBackdrop() {
  const dots: { x: number; y: number }[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 10; col++) {
      dots.push({ x: col * 108 + (row % 2) * 54 + 24, y: row * 88 + 40 });
    }
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -40,
          width: 360,
          height: 360,
          borderRadius: 999,
          background: `radial-gradient(circle, ${POSTER.lagon}55 0%, transparent 68%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 120,
          left: -80,
          width: 280,
          height: 280,
          borderRadius: 999,
          background: `radial-gradient(circle, ${POSTER.couchant}44 0%, transparent 70%)`,
          display: "flex",
        }}
      />
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: d.x,
            top: d.y,
            width: 5,
            height: 5,
            borderRadius: 999,
            background: POSTER.white,
            opacity: 0.12,
            display: "flex",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: WIDTH,
          height: 88,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: -30,
            width: 1140,
            height: 70,
            borderRadius: "50% 50% 0 0",
            background: POSTER.lagonDark,
            opacity: 0.85,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: -20,
            width: 1120,
            height: 55,
            borderRadius: "50% 50% 0 0",
            background: POSTER.lagon,
            opacity: 0.9,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: WIDTH,
            height: 22,
            background: `linear-gradient(90deg, ${POSTER.sandWarm}, ${POSTER.sandDeep})`,
            display: "flex",
          }}
        />
      </div>
    </>
  );
}

function SectionCard({
  title,
  bannerColor,
  bannerGradient,
  children,
}: {
  title: string;
  bannerColor?: string;
  bannerGradient?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 10px 36px rgba(8,59,102,0.28)",
        border: `2px solid ${POSTER.white}55`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "14px 22px",
          background: bannerGradient ?? bannerColor ?? POSTER.lagon,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: POSTER.white,
            opacity: 0.9,
            marginRight: 12,
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: POSTER.white,
            letterSpacing: 2,
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: "rgba(255,255,255,0.96)",
          padding: "6px 14px 10px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function EventRow({ date, text }: { date: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "11px 6px",
        borderBottom: `1px solid ${POSTER.oceanDeep}12`,
      }}
    >
      <div
        style={{
          minWidth: 102,
          padding: "6px 10px",
          borderRadius: 10,
          background: `linear-gradient(135deg, ${POSTER.lagonLight}88, ${POSTER.lagon}44)`,
          fontSize: 12,
          fontWeight: 800,
          color: POSTER.oceanDeep,
          display: "flex",
        }}
      >
        {date}
      </div>
      <div
        style={{
          flex: 1,
          marginLeft: 14,
          fontSize: 15,
          fontWeight: 700,
          color: POSTER.oceanDeep,
          lineHeight: 1.3,
          display: "flex",
        }}
      >
        {truncate(text, 82)}
      </div>
    </div>
  );
}

function ActuRow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        padding: "11px 6px",
        borderBottom: `1px solid ${POSTER.oceanDeep}12`,
      }}
    >
      <div
        style={{
          padding: "5px 10px",
          borderRadius: 8,
          background: posterBadgeGradient(),
          fontSize: 11,
          fontWeight: 900,
          color: POSTER.white,
          letterSpacing: 1,
          display: "flex",
        }}
      >
        ACTU
      </div>
      <div
        style={{
          flex: 1,
          marginLeft: 12,
          fontSize: 15,
          fontWeight: 700,
          color: POSTER.oceanDeep,
          lineHeight: 1.3,
          display: "flex",
        }}
      >
        {truncate(text, 86)}
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
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        color: POSTER.white,
      }}
    >
      <PosterBackdrop />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          padding: "32px 44px 100px",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: posterLogoGradient(),
                color: POSTER.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 900,
                marginRight: 14,
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}
            >
              M
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, fontWeight: 900, display: "flex" }}>MooreaNews</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 3,
                  color: POSTER.lagonLight,
                  display: "flex",
                }}
              >
                AGENDA HEBDO
              </div>
            </div>
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              background: posterBadgeGradient(),
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Ia ora na !
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 28,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 5,
              color: POSTER.lagonLight,
              display: "flex",
            }}
          >
            MOOREA · POLYNÉSIE FRANÇAISE
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              marginTop: 8,
              textAlign: "center",
              display: "flex",
              textShadow: "0 2px 12px rgba(8,59,102,0.35)",
            }}
          >
            Votre semaine
          </div>
          <div
            style={{
              fontSize: 30,
              fontWeight: 900,
              color: POSTER.soleil,
              marginTop: 6,
              display: "flex",
            }}
          >
            {snap.label}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginTop: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 5,
                borderRadius: 999,
                background: POSTER.lagon,
                marginRight: 8,
                display: "flex",
              }}
            />
            <div
              style={{
                width: 48,
                height: 5,
                borderRadius: 999,
                background: POSTER.couchant,
                marginRight: 8,
                display: "flex",
              }}
            />
            <div
              style={{
                width: 48,
                height: 5,
                borderRadius: 999,
                background: POSTER.tiare,
                display: "flex",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {snap.events.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
              <SectionCard
                title="Événements"
                bannerGradient={`linear-gradient(90deg, ${POSTER.lagonDark}, ${POSTER.lagon})`}
              >
                {snap.events.slice(0, 6).map((e) => (
                  <EventRow
                    key={e.slug}
                    date={e.date}
                    text={`${e.title}${e.time ? ` · ${e.time}` : ""}${e.location ? ` · ${e.location}` : ""}`}
                  />
                ))}
              </SectionCard>
            </div>
          )}

          {snap.articles.length > 0 && (
            <SectionCard
              title="Actualités"
              bannerGradient={`linear-gradient(90deg, ${POSTER.couchant}, ${POSTER.tiare})`}
            >
              {snap.articles.slice(0, 6).map((a) => (
                <ActuRow key={a.slug} text={a.title} />
              ))}
            </SectionCard>
          )}

          {snap.events.length === 0 && snap.articles.length === 0 && (
            <SectionCard title="Cette semaine" bannerColor={POSTER.oceanMid}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: 20,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: POSTER.oceanDeep,
                    display: "flex",
                  }}
                >
                  Semaine en cours sur Moorea
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: POSTER.slate,
                    marginTop: 8,
                    display: "flex",
                  }}
                >
                  Agenda complet sur mooreanews.com
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 44,
          right: 44,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, display: "flex" }}>
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: POSTER.lagonLight,
            display: "flex",
          }}
        >
          Affiche générée chaque lundi
        </div>
      </div>
    </div>
  );
}

export const WEEKLY_RECAP_POSTER_SIZE = { width: WIDTH, height: 720 };

export async function renderWeeklyRecapPosterPng(
  snap: WeeklyRecapSnapshot,
): Promise<Buffer> {
  const { ImageResponse } = await import("next/og");
  const size = weeklyRecapPosterSize(snap);
  const res = new ImageResponse(WeeklyRecapPosterElement({ snap }), size);
  return Buffer.from(await res.arrayBuffer());
}
