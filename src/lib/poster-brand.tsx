/**
 * Charte MooreaNews + décor polynésien pour affiches Satori.
 * Ciel couchant, cocotiers, lagon, motu — sans vert « commune ».
 */

export const POSTER = {
  oceanDeep: "#083B66",
  ocean: "#0c4a6e",
  oceanMid: "#0369a1",
  oceanBright: "#0284c7",
  lagon: "#00C2D7",
  lagonBright: "#22d3ee",
  lagonLight: "#67e8f9",
  lagonDark: "#0891b2",
  tiare: "#fb7185",
  tiareSoft: "#fda4af",
  tiareHot: "#f43f5e",
  soleil: "#fcd34d",
  couchant: "#fb923c",
  sand: "#fef3c7",
  sandWarm: "#f7e9a8",
  sandDeep: "#e8c872",
  cocoTrunk: "#78350f",
  cocoTrunkLight: "#a16207",
  cocoNut: "#92400e",
  white: "#ffffff",
  foam: "rgba(255,255,255,0.55)",
  slate: "#64748b",
  slateMid: "#475569",
} as const;

/** Ciel polynésien : rose couchant → lagon → océan profond. */
export function posterBackground(): string {
  return `linear-gradient(180deg, ${POSTER.tiareSoft} 0%, ${POSTER.couchant} 10%, ${POSTER.soleil} 20%, ${POSTER.lagonLight} 38%, ${POSTER.lagon} 52%, ${POSTER.oceanBright} 68%, ${POSTER.oceanDeep} 88%)`;
}

export function posterLogoGradient(): string {
  return `linear-gradient(135deg, ${POSTER.lagon} 0%, ${POSTER.oceanBright} 100%)`;
}

export function posterBadgeGradient(): string {
  return `linear-gradient(90deg, ${POSTER.couchant}, ${POSTER.tiare})`;
}

export function posterCtaGradient(): string {
  return `linear-gradient(90deg, ${POSTER.lagon}, ${POSTER.oceanBright})`;
}

const FROND_ANGLES = [-72, -48, -24, 0, 24, 48, 72] as const;
const FROND_COLORS = [
  POSTER.oceanDeep,
  POSTER.oceanMid,
  POSTER.lagonDark,
  POSTER.lagon,
  POSTER.lagonDark,
  POSTER.oceanMid,
  POSTER.oceanDeep,
] as const;

/** Cocotier stylisé — silhouette au coucher du soleil. */
export function CoconutPalm({
  size,
  top,
  left,
  flip = false,
  opacity = 1,
}: {
  size: number;
  top: number;
  left: number;
  flip?: boolean;
  opacity?: number;
}) {
  const outerStyle: Record<string, string | number> = {
    position: "absolute",
    top,
    left,
    width: size,
    height: size * 1.55,
    opacity,
    display: "flex",
  };
  if (flip) {
    outerStyle.transform = "scaleX(-1)";
  }

  return (
    <div style={outerStyle}>
      <div
        style={{
          position: "relative",
          width: size,
          height: size * 1.55,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: size * 0.05,
            width: size * 0.9,
            height: size * 0.55,
            display: "flex",
          }}
        >
          {FROND_ANGLES.map((deg, i) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                bottom: 0,
                left: size * 0.45 - size * 0.28,
                width: size * 0.56,
                height: size * 0.13,
                borderRadius: "50% 50% 12% 12%",
                background: FROND_COLORS[i] ?? POSTER.lagonDark,
                transform: `rotate(${deg}deg)`,
                transformOrigin: "50% 100%",
                display: "flex",
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            top: size * 0.4,
            left: size * 0.36,
            width: size * 0.09,
            height: size * 0.09,
            borderRadius: 999,
            background: POSTER.cocoNut,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: size * 0.43,
            left: size * 0.5,
            width: size * 0.08,
            height: size * 0.08,
            borderRadius: 999,
            background: POSTER.cocoTrunkLight,
            display: "flex",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: size * 0.43,
            width: size * 0.14,
            height: size * 0.58,
            borderRadius: "40% 40% 6px 6px",
            background: `linear-gradient(90deg, ${POSTER.cocoTrunk}, ${POSTER.cocoTrunkLight}, ${POSTER.cocoTrunk})`,
            display: "flex",
          }}
        />
      </div>
    </div>
  );
}

/** Soleil couchant au-dessus du lagon. */
export function SettingSun() {
  return (
    <div
      style={{
        position: "absolute",
        top: 52,
        left: 390,
        width: 130,
        height: 130,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 200,
          height: 200,
          borderRadius: 999,
          background: `radial-gradient(circle, ${POSTER.soleil}88 0%, transparent 70%)`,
          display: "flex",
        }}
      />
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 999,
          background: `linear-gradient(180deg, ${POSTER.soleil}, ${POSTER.couchant})`,
          display: "flex",
          boxShadow: `0 0 40px ${POSTER.couchant}99`,
        }}
      />
    </div>
  );
}

/** Motu au loin sur la ligne d'horizon. */
export function MotuSilhouette() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 248,
        left: 280,
        width: 520,
        height: 72,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 420,
          height: 48,
          borderRadius: "50% 50% 0 0",
          background: POSTER.oceanDeep,
          opacity: 0.55,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 0,
          width: 140,
          height: 64,
          borderRadius: "50% 50% 0 0",
          background: POSTER.ocean,
          opacity: 0.65,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 40,
          bottom: 0,
          width: 180,
          height: 56,
          borderRadius: "50% 50% 0 0",
          background: POSTER.ocean,
          opacity: 0.6,
          display: "flex",
        }}
      />
    </div>
  );
}

function WaveBand({
  bottom,
  height,
  color,
  opacity,
}: {
  bottom: number;
  height: number;
  color: string;
  opacity: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: -40,
        width: 1160,
        height,
        borderRadius: "50% 50% 0 0",
        background: color,
        opacity,
        display: "flex",
      }}
    />
  );
}

/** Mer, écume et bande de sable en bas de l'affiche. */
export function OceanHorizon() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: 260,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <WaveBand bottom={52} height={110} color={POSTER.oceanMid} opacity={0.75} />
      <WaveBand bottom={28} height={95} color={POSTER.lagonDark} opacity={0.85} />
      <WaveBand bottom={8} height={80} color={POSTER.lagon} opacity={0.9} />
      <div
        style={{
          position: "absolute",
          bottom: 72,
          left: -20,
          width: 1120,
          height: 14,
          borderRadius: 999,
          background: POSTER.foam,
          opacity: 0.7,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 44,
          left: 80,
          width: 920,
          height: 10,
          borderRadius: 999,
          background: POSTER.foam,
          opacity: 0.45,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 36,
          background: `linear-gradient(180deg, ${POSTER.sandWarm}, ${POSTER.sandDeep})`,
          display: "flex",
        }}
      />
    </div>
  );
}

/** Décor complet : soleil, motu, mer, cocotiers. */
export function PosterPolynesianScenery() {
  return (
    <>
      <SettingSun />
      <MotuSilhouette />
      <OceanHorizon />
      <CoconutPalm size={155} top={28} left={-42} opacity={0.92} />
      <CoconutPalm size={130} top={55} left={920} flip opacity={0.88} />
      <CoconutPalm size={95} top={175} left={855} flip opacity={0.55} />
      <CoconutPalm size={78} top={210} left={-18} opacity={0.5} />
    </>
  );
}

/** Carte contenu avec léger relief « carte postale ». */
export function posterCardStyle(extra?: Record<string, string | number>): Record<string, string | number> {
  return {
    borderRadius: 24,
    background: "rgba(255,255,255,0.96)",
    border: `3px solid ${POSTER.sand}`,
    boxShadow: "0 12px 40px rgba(8,59,102,0.22)",
    ...extra,
  };
}
