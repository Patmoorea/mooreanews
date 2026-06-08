/**
 * Affiche garde week-end — design MooreaNews chaleureux (lagon, palmiers).
 * Format portrait 1080×1350 (Satori / next/og).
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { SITE } from "@/lib/constants";
import {
  POSTER,
  posterBackground,
  posterBadgeGradient,
  posterCardStyle,
  posterCtaGradient,
  posterLogoGradient,
  PosterPolynesianScenery,
} from "@/lib/poster-brand";

const POSTER_SIZE = { width: 1080, height: 1350 } as const;

function formatDoctorDisplay(name: string): string {
  const n = name.replace(/^Dr\.?\s+/i, "").trim();
  return `Dr ${n}`;
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
        padding: "14px 10px",
        borderRadius: 16,
        background: "rgba(255,255,255,0.94)",
        border: "2px solid rgba(0,194,215,0.35)",
        boxShadow: "0 8px 24px rgba(8,59,102,0.15)",
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900, color: POSTER.lagon, display: "flex" }}>
        {district}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: POSTER.ocean, marginTop: 4, display: "flex" }}>
        {phone}
      </div>
      {saturday && (
        <div
          style={{
            fontSize: 13,
            color: POSTER.slateMid,
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700, color: POSTER.couchant }}>Samedi</div>
          <div style={{ display: "flex" }}>{saturday}</div>
        </div>
      )}
      {sunday && (
        <div
          style={{
            fontSize: 13,
            color: POSTER.slateMid,
            marginTop: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700, color: POSTER.couchant }}>Dimanche</div>
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
          padding: "28px 40px 16px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: posterLogoGradient(),
              color: POSTER.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 900,
              marginRight: 14,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: POSTER.white, display: "flex" }}>
              MooreaNews
            </div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: 2,
                color: POSTER.lagonLight,
                fontWeight: 700,
                display: "flex",
              }}
            >
              Garde week-end · Moorea
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: POSTER.lagonLight,
            opacity: 0.95,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex" }}>Ia ora na !</div>
          <div style={{ display: "flex" }}>Commune Moorea-Maiao</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "8px 40px 20px",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: POSTER.white,
            background: posterBadgeGradient(),
            padding: "10px 32px",
            borderRadius: 999,
            display: "flex",
          }}
        >
          Médecin et pharmacies de garde
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: POSTER.soleil,
            marginTop: 14,
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
          padding: "0 36px 16px",
          position: "relative",
        }}
      >
        {snap.doctor?.name && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "28px 32px",
              ...posterCardStyle(),
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: POSTER.lagon,
                letterSpacing: 1,
                display: "flex",
              }}
            >
              Médecin de garde
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: POSTER.ocean,
                marginTop: 12,
                fontStyle: "italic",
                display: "flex",
              }}
            >
              {formatDoctorDisplay(snap.doctor.name)}
            </div>

            {(snap.doctorHours?.saturday || snap.doctorHours?.sunday) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: 16,
                  justifyContent: "center",
                }}
              >
                {snap.doctorHours.saturday && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "8px 20px",
                      borderRadius: 12,
                      background: POSTER.sand,
                      marginRight: snap.doctorHours.sunday ? 12 : 0,
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 13, fontWeight: 700, color: POSTER.couchant }}>
                      Samedi
                    </div>
                    <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: POSTER.ocean }}>
                      {snap.doctorHours.saturday}
                    </div>
                  </div>
                )}
                {snap.doctorHours.sunday && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "8px 20px",
                      borderRadius: 12,
                      background: POSTER.sand,
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 13, fontWeight: 700, color: POSTER.couchant }}>
                      Dimanche
                    </div>
                    <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: POSTER.ocean }}>
                      {snap.doctorHours.sunday}
                    </div>
                  </div>
                )}
              </div>
            )}

            {snap.doctorAddress && (
              <div
                style={{
                  fontSize: 17,
                  color: POSTER.slate,
                  marginTop: 14,
                  display: "flex",
                  textAlign: "center",
                }}
              >
                {snap.doctorAddress}
              </div>
            )}

            {snap.doctor.phone && snap.doctor.phone !== "—" && (
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: POSTER.white,
                  background: posterCtaGradient(),
                  marginTop: 18,
                  padding: "12px 36px",
                  borderRadius: 999,
                  display: "flex",
                }}
              >
                {snap.doctor.phone}
              </div>
            )}
          </div>
        )}
      </div>

      {pharmacies.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "0 24px 20px",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: POSTER.white,
              textAlign: "center",
              marginBottom: 12,
              display: "flex",
              justifyContent: "center",
            }}
          >
            Horaires pharmacies
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
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

      <div
        style={{
          padding: "18px 36px 30px",
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
            Urgences : 15 · DSP 40 47 01 44
          </div>
          <div style={{ display: "flex", fontSize: 13, color: POSTER.slate, marginTop: 4 }}>
            Hôpital Afareaitu 40 55 22 22 · Pompiers 18
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 14,
            fontWeight: 700,
            color: POSTER.lagon,
          }}
        >
          {SITE.url.replace(/^https?:\/\//, "")}
        </div>
      </div>
    </div>
  );
}

export const GARDE_WEEKEND_POSTER_SIZE = POSTER_SIZE;

export async function renderGardeWeekendPosterPng(
  snap: GardeMooreaSnapshot,
): Promise<Buffer> {
  const { ImageResponse } = await import("next/og");
  const res = new ImageResponse(GardeWeekendPosterElement({ snap }), POSTER_SIZE);
  return Buffer.from(await res.arrayBuffer());
}
