import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #67e8f9 0%, #06b6d4 30%, #0284c7 60%, #0c4a6e 100%)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, #fcd34d, #fb7185, #14b8a6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700 }}>{SITE.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Toute la vie de Moorea, réunie ici.
          </div>
          <div
            style={{
              fontSize: "28px",
              opacity: 0.9,
            }}
          >
            Actus · Événements · Annonces · Ferries · Météo en direct
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            opacity: 0.8,
          }}
        >
          <span>🏝 Polynésie française</span>
          <span>mooreanews.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
