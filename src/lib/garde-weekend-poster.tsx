/**
 * Affiche garde week-end — format officiel sobre (1080×1350, Satori / next/og).
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { SITE } from "@/lib/constants";

const POSTER_SIZE = { width: 1080, height: 1350 } as const;

const NAVY = "#0c2d48";
const RED = "#b91c1c";
const WHITE = "#ffffff";
const SLATE = "#334155";
const MUTED = "#64748b";
const LIGHT = "#f8fafc";
const LINE = "#cbd5e1";

function formatDoctorDisplay(name: string): string {
  const n = name.replace(/^Dr\.?\s+/i, "").trim();
  return `Dr ${n}`;
}

export function posterHasDisplayContent(snap: GardeMooreaSnapshot): boolean {
  return Boolean(
    snap.doctor?.name ||
      (snap.pharmacyHours && snap.pharmacyHours.length > 0),
  );
}

function PharmacyRow({
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
        display: "flex",
        flexDirection: "row",
        borderBottom: `1px solid ${LINE}`,
        padding: "14px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          width: 180,
          fontSize: 20,
          fontWeight: 800,
          color: NAVY,
        }}
      >
        {district}
      </div>
      <div
        style={{
          display: "flex",
          width: 160,
          fontSize: 20,
          fontWeight: 800,
          color: RED,
        }}
      >
        {phone}
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          fontSize: 16,
          color: SLATE,
        }}
      >
        {saturday && (
          <div style={{ display: "flex" }}>
            <span style={{ display: "flex", fontWeight: 700, marginRight: 8 }}>Sam.</span>
            {saturday}
          </div>
        )}
        {sunday && (
          <div style={{ display: "flex", marginTop: 4 }}>
            <span style={{ display: "flex", fontWeight: 700, marginRight: 8 }}>Dim.</span>
            {sunday}
          </div>
        )}
      </div>
    </div>
  );
}

export function GardeWeekendPosterElement({ snap }: { snap: GardeMooreaSnapshot }) {
  const pharmacies = snap.pharmacyHours?.slice(0, 3) ?? [];
  const hasDoctor = Boolean(snap.doctor?.name);
  const hasPharmacies = pharmacies.length > 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: LIGHT,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: NAVY,
          padding: "40px 48px 32px",
          color: WHITE,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                opacity: 0.8,
              }}
            >
              MOOREA-MAIAO · POLYNÉSIE FRANÇAISE
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 900,
                marginTop: 10,
                lineHeight: 1.1,
              }}
            >
              Garde médicale
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 44,
                fontWeight: 900,
                lineHeight: 1.1,
              }}
            >
              du week-end
            </div>
          </div>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 8,
              backgroundColor: RED,
              color: WHITE,
              fontSize: 36,
              fontWeight: 900,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            +
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            marginTop: 20,
            color: "#93c5fd",
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
          padding: "32px 48px",
        }}
      >
        {hasDoctor ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: WHITE,
              border: `2px solid ${LINE}`,
              borderRadius: 12,
              padding: "28px 32px",
              marginBottom: hasPharmacies ? 28 : 0,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 2,
                color: RED,
              }}
            >
              MÉDECIN DE GARDE
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 40,
                fontWeight: 900,
                color: NAVY,
                marginTop: 12,
              }}
            >
              {formatDoctorDisplay(snap.doctor!.name)}
            </div>
            {snap.doctorAddress && (
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: MUTED,
                  marginTop: 10,
                }}
              >
                {snap.doctorAddress}
              </div>
            )}
            {(snap.doctorHours?.saturday || snap.doctorHours?.sunday) && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginTop: 16,
                }}
              >
                {snap.doctorHours.saturday && (
                  <div
                    style={{
                      display: "flex",
                      fontSize: 17,
                      color: SLATE,
                      marginRight: snap.doctorHours.sunday ? 32 : 0,
                    }}
                  >
                    <span style={{ display: "flex", fontWeight: 800, marginRight: 8 }}>
                      Samedi
                    </span>
                    {snap.doctorHours.saturday}
                  </div>
                )}
                {snap.doctorHours.sunday && (
                  <div style={{ display: "flex", fontSize: 17, color: SLATE }}>
                    <span style={{ display: "flex", fontWeight: 800, marginRight: 8 }}>
                      Dimanche
                    </span>
                    {snap.doctorHours.sunday}
                  </div>
                )}
              </div>
            )}
            {snap.doctor!.phone && snap.doctor!.phone !== "—" && (
              <div
                style={{
                  display: "flex",
                  fontSize: 36,
                  fontWeight: 900,
                  color: WHITE,
                  backgroundColor: RED,
                  marginTop: 20,
                  padding: "14px 28px",
                  borderRadius: 8,
                  width: "fit-content",
                }}
              >
                {snap.doctor!.phone}
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: WHITE,
              border: `2px solid ${LINE}`,
              borderRadius: 12,
              padding: "24px 32px",
              marginBottom: hasPharmacies ? 28 : 0,
            }}
          >
            <div style={{ display: "flex", fontSize: 22, fontWeight: 800, color: NAVY }}>
              Médecin de garde
            </div>
            <div style={{ display: "flex", fontSize: 18, color: MUTED, marginTop: 8 }}>
              Non publié — appelez la DSP : 40 47 01 44
            </div>
          </div>
        )}

        {hasPharmacies && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: WHITE,
              border: `2px solid ${LINE}`,
              borderRadius: 12,
              padding: "24px 32px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: 2,
                color: NAVY,
                marginBottom: 8,
              }}
            >
              PHARMACIES DE GARDE — HORAIRES
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                borderBottom: `2px solid ${NAVY}`,
                paddingBottom: 8,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 180,
                  fontSize: 13,
                  fontWeight: 700,
                  color: MUTED,
                }}
              >
                SECTEUR
              </div>
              <div
                style={{
                  display: "flex",
                  width: 160,
                  fontSize: 13,
                  fontWeight: 700,
                  color: MUTED,
                }}
              >
                TÉLÉPHONE
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 700,
                  color: MUTED,
                }}
              >
                HORAIRES
              </div>
            </div>
            {pharmacies.map((p) => (
              <PharmacyRow
                key={p.district}
                district={p.district}
                phone={p.phone}
                saturday={p.saturday}
                sunday={p.sunday}
              />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: NAVY,
          padding: "24px 48px",
          color: WHITE,
        }}
      >
        <div style={{ display: "flex", fontSize: 17, fontWeight: 800 }}>
          Urgences : 15 (SAMU) · DSP 40 47 01 44 / 40 47 01 47
        </div>
        <div style={{ display: "flex", fontSize: 15, marginTop: 6, opacity: 0.85 }}>
          Hôpital Afareaitu 40 55 22 22 · Pompiers 18
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 14,
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          <div style={{ display: "flex" }}>Source : Commune Moorea-Maiao · COPPF</div>
          <div style={{ display: "flex" }}>{SITE.url.replace(/^https?:\/\//, "")}</div>
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
