import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Carte Open Graph générée dynamiquement, dans l'esprit graphique de la
 * bannière officielle (palette ocean / lagon, hibiscus, motifs tribaux).
 * On évite de charger l'image PNG depuis le filesystem pour rester compatible
 * Edge Runtime.
 */
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background:
            "linear-gradient(135deg, #ECFEFF 0%, #A5F3FC 25%, #22D3EE 55%, #0E7490 100%)",
          color: "#0c4a6e",
          fontFamily: "system-ui",
          position: "relative",
        }}
      >
        {/* Silhouette de montagne stylisée Moorea */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            opacity: 0.18,
          }}
        >
          <div
            style={{
              fontSize: 600,
              lineHeight: 1,
              color: "#0c4a6e",
            }}
          >
            ⛰
          </div>
        </div>

        {/* En-tête */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #0c4a6e 0%, #0e7490 50%, #14b8a6 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 44,
              fontWeight: 800,
              boxShadow: "0 10px 30px rgba(8,47,73,0.35)",
            }}
          >
            M
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.05,
            }}
          >
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
              <span style={{ color: "#0c4a6e" }}>Moorea</span>
              <span style={{ color: "#0e7490" }}>News</span>
            </div>
            <div
              style={{
                fontSize: 18,
                color: "#0e7490",
                textTransform: "uppercase",
                letterSpacing: 3,
                marginTop: 4,
              }}
            >
              Polynésie française
            </div>
          </div>
        </div>

        {/* Titre principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1.5,
              color: "#082F49",
            }}
          >
            L&apos;info de Moorea et de la Polynésie française
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#0e7490",
              fontStyle: "italic",
            }}
          >
            Votre source d&apos;information locale et fiable
          </div>
        </div>

        {/* Pied : badges + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 1,
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {["Actus", "Vie locale", "Tourisme", "Événements", "Infos"].map(
              (b) => (
                <div
                  key={b}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.85)",
                    color: "#0c4a6e",
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  {b}
                </div>
              ),
            )}
          </div>
          <div style={{ color: "#0c4a6e", fontWeight: 700 }}>
            mooreanews.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
