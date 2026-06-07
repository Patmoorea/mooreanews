/**
 * Affiche garde week-end — design MooreaNews (next/og / Satori).
 * Chaque <div> multi-enfants doit avoir display:flex explicite.
 */

import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import { SITE } from "@/lib/constants";

const POSTER = { width: 1080, height: 1350 } as const;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function formatDoctor(name: string): string {
  return name.startsWith("Dr") ? name : `Dr ${name}`;
}

export function GardeWeekendPosterElement({ snap }: { snap: GardeMooreaSnapshot }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(165deg, #083B66 0%, #0e7490 40%, #00C2D7 75%, #ECFEFF 100%)",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ padding: "44px 48px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 999,
              background: "white",
              color: "#083B66",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 32, fontWeight: 900 }}>MooreaNews</div>
            <div style={{ fontSize: 14, letterSpacing: 3, opacity: 0.9 }}>
              GARDE WEEK-END · MOOREA
            </div>
          </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{snap.label}</div>
        <div style={{ fontSize: 16, opacity: 0.85 }}>Source : Commune Moorea-Maiao</div>
      </div>

      <div style={{ flex: 1, padding: "0 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        {snap.doctor?.name && (
          <div
            style={{
              padding: "20px 24px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.95)",
              color: "#082F49",
              borderLeft: "6px solid #f59e0b",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0e7490" }}>
              Médecin de garde
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
              {formatDoctor(snap.doctor.name.replace(/^Dr\.?\s+/i, ""))}
            </div>
            {snap.doctorAddress && (
              <div style={{ fontSize: 17, marginTop: 6, color: "#475569" }}>
                {truncate(snap.doctorAddress, 70)}
              </div>
            )}
            {(snap.doctorHours?.saturday || snap.doctorHours?.sunday) && (
              <div style={{ fontSize: 16, marginTop: 8, color: "#0e7490", display: "flex" }}>
                {[
                  snap.doctorHours.saturday && `Sam. ${snap.doctorHours.saturday}`,
                  snap.doctorHours.sunday && `Dim. ${snap.doctorHours.sunday}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            )}
            {snap.doctor.phone && snap.doctor.phone !== "—" && (
              <div style={{ fontSize: 26, fontWeight: 900, marginTop: 10, color: "#083B66" }}>
                {snap.doctor.phone}
              </div>
            )}
          </div>
        )}

        {snap.pharmacyHours && snap.pharmacyHours.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>Horaires pharmacies</div>
            {snap.pharmacyHours.slice(0, 3).map((p) => (
              <div
                key={p.district}
                style={{
                  padding: "12px 16px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.9)",
                  color: "#082F49",
                  fontSize: 15,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex" }}>
                    {`${p.district}${p.phone ? ` · ${p.phone}` : ""}`}
                  </div>
                  <div style={{ color: "#475569", marginTop: 4, display: "flex" }}>
                    {[
                      p.saturday && `sam. ${p.saturday}`,
                      p.sunday && `dim. ${p.sunday}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "18px 48px 32px",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 18,
          fontWeight: 700,
          borderTop: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(8,59,102,0.4)",
        }}
      >
        <span>Urgences : 15 · DSP 40 47 01 44</span>
        <span>{SITE.url.replace(/^https?:\/\//, "")}</span>
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
