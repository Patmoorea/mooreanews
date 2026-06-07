/**
 * Affiche garde week-end — design MooreaNews chaleureux (lagon, palmiers).
 * Format portrait 1080×1350 (Satori / next/og).
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { SITE } from "@/lib/constants";

const POSTER = { width: 1080, height: 1350 } as const;

const OCEAN = "#0c4a6e";
const LAGON = "#0e7490";
const TIARE = "#f97316";
const SAND = "#fef3c7";
const WHITE = "#ffffff";

function formatDoctorDisplay(name: string): string {
  const n = name.replace(/^Dr\.?\s+/i, "").trim();
  return `Dr ${n}`;
}

function PalmSilhouette({ size, top, left, opacity }: {
  size: number;
  top: number;
  left: number;
  opacity: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: size,
        height: size * 1.4,
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: size * 0.9,
          height: size * 0.55,
          borderRadius: "50% 50% 20% 20%",
          background: "#15803d",
          display: "flex",
        }}
      />
      <div
        style={{
          width: size * 0.12,
          height: size * 0.85,
          background: "#92400e",
          marginTop: -size * 0.08,
          borderRadius: 4,
          display: "flex",
        }}
      />
    </div>
  );
}

function HibiscusDot({ top, left }: { top: number; left: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width: 36,
        height: 36,
        borderRadius: 999,
        background: "#fb7185",
        opacity: 0.45,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        color: WHITE,
        fontWeight: 900,
      }}
    >
      +
    </div>
  );
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
        border: "2px solid rgba(14,116,144,0.25)",
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 900, color: LAGON, display: "flex" }}>
        {district}
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: OCEAN, marginTop: 4, display: "flex" }}>
        {phone}
      </div>
      {saturday && (
        <div
          style={{
            fontSize: 13,
            color: "#475569",
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700, color: TIARE }}>Samedi</div>
          <div style={{ display: "flex" }}>{saturday}</div>
        </div>
      )}
      {sunday && (
        <div
          style={{
            fontSize: 13,
            color: "#475569",
            marginTop: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontWeight: 700, color: TIARE }}>Dimanche</div>
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
        background:
          "linear-gradient(165deg, #ECFEFF 0%, #7DD3FC 22%, #22D3EE 48%, #0E7490 78%, #155E75 100%)",
        color: OCEAN,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      <PalmSilhouette size={100} top={60} left={-10} opacity={0.28} />
      <PalmSilhouette size={80} top={180} left={900} opacity={0.22} />
      <PalmSilhouette size={70} top={380} left={40} opacity={0.18} />
      <HibiscusDot top={120} left={920} />
      <HibiscusDot top={280} left={80} />
      <HibiscusDot top={500} left={960} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "28px 40px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              background: `linear-gradient(135deg, ${OCEAN} 0%, ${LAGON} 100%)`,
              color: WHITE,
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
            <div style={{ fontSize: 26, fontWeight: 900, color: OCEAN, display: "flex" }}>
              MooreaNews
            </div>
            <div
              style={{
                fontSize: 13,
                letterSpacing: 2,
                color: LAGON,
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
            color: OCEAN,
            opacity: 0.8,
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
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: WHITE,
            background: `linear-gradient(90deg, ${TIARE}, #fb7185)`,
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
            color: OCEAN,
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
        }}
      >
        {snap.doctor?.name && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "28px 32px",
              borderRadius: 24,
              background: WHITE,
              border: `4px solid ${SAND}`,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: LAGON,
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
                color: OCEAN,
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
                      background: "#FFF7ED",
                      marginRight: snap.doctorHours.sunday ? 12 : 0,
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 13, fontWeight: 700, color: TIARE }}>
                      Samedi
                    </div>
                    <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: OCEAN }}>
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
                      background: "#FFF7ED",
                    }}
                  >
                    <div style={{ display: "flex", fontSize: 13, fontWeight: 700, color: TIARE }}>
                      Dimanche
                    </div>
                    <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: OCEAN }}>
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
                  color: "#64748b",
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
                  color: WHITE,
                  background: `linear-gradient(90deg, ${LAGON}, #14b8a6)`,
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
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: WHITE,
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
          background: "rgba(255,255,255,0.9)",
          borderTop: `3px solid ${SAND}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 15, fontWeight: 800, color: OCEAN }}>
            Urgences : 15 · DSP 40 47 01 44
          </div>
          <div style={{ display: "flex", fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Hôpital Afareaitu 40 55 22 22 · Pompiers 18
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 14,
            fontWeight: 700,
            color: LAGON,
          }}
        >
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
