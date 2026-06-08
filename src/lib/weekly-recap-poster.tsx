/**
 * Affiche récap semaine — format compact, style éditorial MooreaNews.
 * Hauteur dynamique selon le nombre de lignes (pas de portrait Instagram vide).
 */

import type { WeeklyRecapSnapshot } from "@/lib/weekly-recap-data";
import { SITE } from "@/lib/constants";
import { POSTER, posterLogoGradient } from "@/lib/poster-brand";

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

/** Hauteur PNG proportionnelle au contenu. */
export function weeklyRecapPosterSize(snap: WeeklyRecapSnapshot): {
  width: number;
  height: number;
} {
  const eventRows = snap.events.length > 0 ? Math.min(snap.events.length, 6) : 0;
  const articleRows = snap.articles.length > 0 ? Math.min(snap.articles.length, 6) : 0;
  const empty = eventRows === 0 && articleRows === 0;

  let h = 132; // en-tête
  if (eventRows > 0) h += 36 + eventRows * 46;
  if (articleRows > 0) h += 36 + articleRows * 46;
  if (empty) h += 100;
  h += 56; // pied de page

  return { width: WIDTH, height: Math.min(Math.max(h, 420), 920) };
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      <div
        style={{
          width: 4,
          height: 18,
          background: POSTER.lagon,
          borderRadius: 2,
          marginRight: 10,
          display: "flex",
        }}
      />
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 2,
          color: POSTER.oceanMid,
          textTransform: "uppercase",
          display: "flex",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function DigestRow({ left, text }: { left: string; text: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        padding: "11px 0",
        borderBottom: `1px solid ${POSTER.oceanDeep}14`,
      }}
    >
      <div
        style={{
          width: 108,
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          color: POSTER.lagonDark,
          display: "flex",
        }}
      >
        {left}
      </div>
      <div
        style={{
          flex: 1,
          fontSize: 15,
          fontWeight: 600,
          color: POSTER.oceanDeep,
          lineHeight: 1.35,
          display: "flex",
        }}
      >
        {truncate(text, 88)}
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
        background: POSTER.white,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Bandeau */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 40px",
          background: POSTER.oceanDeep,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: posterLogoGradient(),
              color: POSTER.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 900,
              marginRight: 14,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: POSTER.white,
                display: "flex",
              }}
            >
              MooreaNews
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: POSTER.lagonLight,
                letterSpacing: 1,
                display: "flex",
              }}
            >
              Agenda & actualités de la semaine
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: POSTER.white,
            display: "flex",
          }}
        >
          {snap.label}
        </div>
      </div>

      {/* Ligne accent lagon */}
      <div style={{ height: 3, background: POSTER.lagon, display: "flex" }} />

      {/* Contenu */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "20px 40px 12px",
          flex: 1,
        }}
      >
        {snap.events.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 12 }}>
            <SectionTitle label="Événements" />
            {snap.events.slice(0, 6).map((e) => (
              <DigestRow
                key={e.slug}
                left={e.date}
                text={`${e.title}${e.time ? ` · ${e.time}` : ""}${e.location ? ` · ${e.location}` : ""}`}
              />
            ))}
          </div>
        )}

        {snap.articles.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <SectionTitle label="Actualités" />
            {snap.articles.slice(0, 6).map((a) => (
              <DigestRow key={a.slug} left="Actu" text={a.title} />
            ))}
          </div>
        )}

        {snap.events.length === 0 && snap.articles.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "24px 0",
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: POSTER.oceanDeep,
                display: "flex",
              }}
            >
              Semaine calme sur Moorea
            </div>
            <div
              style={{
                fontSize: 14,
                color: POSTER.slate,
                marginTop: 6,
                display: "flex",
              }}
            >
              Consultez l&apos;agenda complet sur mooreanews.com
            </div>
          </div>
        )}
      </div>

      {/* Pied */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 40px",
          background: "#f0f9ff",
          borderTop: `1px solid ${POSTER.oceanDeep}18`,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: POSTER.oceanMid,
            display: "flex",
          }}
        >
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
        <div style={{ fontSize: 12, color: POSTER.slate, display: "flex" }}>
          Généré automatiquement chaque lundi
        </div>
      </div>
    </div>
  );
}

export const WEEKLY_RECAP_POSTER_SIZE = { width: WIDTH, height: 640 };

export async function renderWeeklyRecapPosterPng(
  snap: WeeklyRecapSnapshot,
): Promise<Buffer> {
  const { ImageResponse } = await import("next/og");
  const size = weeklyRecapPosterSize(snap);
  const res = new ImageResponse(WeeklyRecapPosterElement({ snap }), size);
  return Buffer.from(await res.arrayBuffer());
}
