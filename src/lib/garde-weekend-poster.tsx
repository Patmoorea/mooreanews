/**
 * Affiche garde week-end — style officiel commune, branding MooreaNews.
 * Format portrait 1080×1350 (Satori / next/og).
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { SITE } from "@/lib/constants";

const POSTER = { width: 1080, height: 1350 } as const;

const GREEN = "#1b5e3b";
const GREEN_DARK = "#0f3d26";
const GOLD = "#f5c842";
const GOLD_LIGHT = "#fde68a";

function formatDoctorDisplay(name: string): string {
  const n = name.replace(/^Dr\.?\s+/i, "").trim();
  return `Dr. ${n}`;
}

function PharmacyColumn({
  district,
  phone,
  saturday,
  sunday,
}: {
  district: string;
  phone: string;
  saturday?: string;
  sunday?: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 8px",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          display: "flex",
        }}
      >
        {district.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: GOLD,
          marginTop: 6,
          display: "flex",
        }}
      >
        {phone}
      </div>
      {saturday && (
        <div
          style={{
            fontSize: 15,
            color: GOLD_LIGHT,
            marginTop: 10,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700 }}>Samedi</div>
          <div style={{ display: "flex" }}>{saturday}</div>
        </div>
      )}
      {sunday && (
        <div
          style={{
            fontSize: 15,
            color: GOLD_LIGHT,
            marginTop: 8,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700 }}>Dimanche</div>
          <div style={{ display: "flex" }}>{sunday}</div>
        </div>
      )}
    </div>
  );
}

export function GardeWeekendPosterElement({ snap }: { snap: GardeMooreaSnapshot }) {
  const pharmacies = snap.pharmacyHours?.slice(0, 3) ?? [];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `linear-gradient(180deg, ${GREEN} 0%, ${GREEN_DARK} 55%, ${GREEN} 100%)`,
        color: "white",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Bandeau MooreaNews */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 36px",
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 999,
              background: "white",
              color: GREEN_DARK,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>MooreaNews</div>
            <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.9 }}>
              GARDE WEEK-END · MOOREA
            </div>
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, display: "flex" }}>
          Source : Commune Moorea-Maiao
        </div>
      </div>

      {/* Médecin de garde */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "28px 40px 16px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: GOLD,
            letterSpacing: 2,
            display: "flex",
          }}
        >
          MÉDECIN DE GARDE
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            marginTop: 12,
            display: "flex",
          }}
        >
          {snap.label.toUpperCase()}
        </div>

        {snap.doctor?.name && (
          <div
            style={{
              fontSize: 44,
              fontStyle: "italic",
              fontWeight: 600,
              marginTop: 28,
              color: "white",
              display: "flex",
            }}
          >
            {formatDoctorDisplay(snap.doctor.name)}
          </div>
        )}

        {(snap.doctorHours?.saturday || snap.doctorHours?.sunday) && (
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: GOLD,
              marginTop: 16,
              display: "flex",
            }}
          >
            {[
              snap.doctorHours.saturday && `SAMEDI : ${snap.doctorHours.saturday.toUpperCase()}`,
              snap.doctorHours.sunday && `DIMANCHE : ${snap.doctorHours.sunday.toUpperCase()}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}

        {snap.doctorAddress && (
          <div
            style={{
              fontSize: 18,
              fontStyle: "italic",
              color: GOLD_LIGHT,
              marginTop: 12,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {snap.doctorAddress}
          </div>
        )}

        {snap.doctor?.phone && snap.doctor.phone !== "—" && (
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: GOLD,
              marginTop: 14,
              display: "flex",
            }}
          >
            {snap.doctor.phone}
          </div>
        )}
      </div>

      {/* Pharmacies — 3 colonnes */}
      {pharmacies.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 24px 20px",
          }}
        >
          <div
            style={{
              height: 2,
              background: "rgba(255,255,255,0.35)",
              margin: "0 16px 16px",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              textAlign: "center",
              marginBottom: 16,
              display: "flex",
              justifyContent: "center",
            }}
          >
            HORAIRES PHARMACIES
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
            {pharmacies.map((p) => (
              <PharmacyColumn
                key={p.district}
                district={p.district}
                phone={p.phone}
                saturday={p.saturday}
                sunday={p.sunday}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pied de page */}
      <div
        style={{
          padding: "16px 36px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(0,0,0,0.3)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex" }}>Urgences : 15 · DSP 40 47 01 44</div>
          <div style={{ display: "flex", fontSize: 13, opacity: 0.85 }}>
            Hôpital Afareaitu 40 55 22 22
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 15, color: GOLD_LIGHT }}>
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>
  );
}

export const GARDE_WEEKEND_POSTER_SIZE = POSTER;

export async function renderGardeWeekendPosterPng(
  snap: GardeMooreaSnapshot,
): Promise<Buffer> {
  const { ImageResponse } = await import("next/og");
  const res = new ImageResponse(GardeWeekendPosterElement({ snap }), POSTER);
  return Buffer.from(await res.arrayBuffer());
}
