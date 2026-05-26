import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Moorea Hub — Le portail de l'île de Moorea";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #06b6d4 100%)",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          color: "white",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 60,
            right: 100,
            fontSize: 160,
            opacity: 0.3,
          }}
        >
          🌺
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              background: "linear-gradient(135deg, #22d3ee, #0c4a6e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "0.1em",
              opacity: 0.85,
            }}
          >
            MOOREA HUB
          </div>
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.05,
            maxWidth: 900,
            marginBottom: 24,
          }}
        >
          Le portail de l&apos;île sœur, en temps réel
        </div>
        <div style={{ fontSize: 28, opacity: 0.85, maxWidth: 900 }}>
          Événements, annonces, météo, ferries, restaurants… tout Moorea en un
          seul endroit
        </div>
      </div>
    ),
    { ...size }
  );
}
