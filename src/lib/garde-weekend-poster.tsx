/**
 * Affiche garde week-end MooreaNews (1080×1920, Satori / next/og).
 * Papier sable, colonne de dates, bandeau téléphone, trois pharmacies.
 * Frise de losanges. Pas de photo, pas de dégradé, pas de fleur.
 * Le rose n'existe que dans le bandeau Octobre Rose (calendrier saisonnier).
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import {
  GARDE_IMAGE_CREDIT,
  GARDE_WEEKEND_POSTER_SIZE,
  gardeDateColumn,
  gardeHourRows,
  gardePharmacyRows,
  gardePosterDoctorName,
  gardePosterDutySource,
  gardePosterLocation,
  gardePosterPhone,
  gardePosterSeason,
} from "@/lib/garde-weekend-poster-model";

const OCEAN = "#072844";
const LAGON = "#0F6E73";
const SAND = "#F4EFE6";

const WIDTH = GARDE_WEEKEND_POSTER_SIZE.width;
const FRIEZE_H = 56;
const DIAMOND = 22;
const DIAMOND_GAP = 18;

function diamondPoints(x: number, y: number, size: number): string {
  const midX = x + size / 2;
  const midY = y + size / 2;
  return `${midX},${y} ${x + size},${midY} ${midX},${y + size} ${x},${midY}`;
}

function DiamondFrieze() {
  const count = 26;
  const span = count * DIAMOND + (count - 1) * DIAMOND_GAP;
  const start = (WIDTH - span) / 2;
  const top = (FRIEZE_H - DIAMOND) / 2;
  const diamonds = Array.from({ length: count }, (_, index) => {
    const x = start + index * (DIAMOND + DIAMOND_GAP);
    return {
      points: diamondPoints(x, top, DIAMOND),
      fill: index % 2 === 0 ? SAND : LAGON,
    };
  });

  return (
    <svg
      width={WIDTH}
      height={FRIEZE_H}
      viewBox={`0 0 ${WIDTH} ${FRIEZE_H}`}
      shapeRendering="geometricPrecision"
    >
      <rect width={WIDTH} height={FRIEZE_H} fill={OCEAN} />
      {diamonds.map((diamond) => (
        <polygon key={diamond.points} points={diamond.points} fill={diamond.fill} />
      ))}
    </svg>
  );
}

function DateColumn({ validFrom, validTo }: { validFrom: string; validTo: string }) {
  const column = gardeDateColumn(validFrom, validTo);
  const dayNodes = column.days.flatMap((day, index) => {
    const nodes = [];
    if (index > 0) {
      nodes.push(
        <div
          key={`slash-${day}`}
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 56,
            lineHeight: 1,
            color: LAGON,
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          /
        </div>,
      );
    }
    nodes.push(
      <div
        key={day}
        style={{
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 132,
          lineHeight: 1,
          color: SAND,
        }}
      >
        {day}
      </div>,
    );
    return nodes;
  });

  return (
    <div
      style={{
        width: 300,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: OCEAN,
        padding: "40px 32px",
      }}
    >
      {dayNodes}
      <div
        style={{
          display: "flex",
          marginTop: 18,
          fontFamily: "Marcellus",
          fontSize: 36,
          lineHeight: 1,
          color: SAND,
        }}
      >
        {column.month}
      </div>
    </div>
  );
}

function TitleBlock({ snap }: { snap: GardeMooreaSnapshot }) {
  const location = gardePosterLocation(snap);
  const hours = gardeHourRows(snap);

  return (
    <div
      style={{
        width: 780,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: SAND,
        padding: "44px 48px 40px 44px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Marcellus",
          fontSize: 30,
          lineHeight: 1.2,
          color: LAGON,
        }}
      >
        MooreaNews vous informe que le
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 14,
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 0.96,
          color: OCEAN,
        }}
      >
        médecin
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 0.96,
          color: OCEAN,
        }}
      >
        de garde
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 28,
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 40,
          lineHeight: 1.1,
          color: OCEAN,
        }}
      >
        {gardePosterDoctorName(snap.doctor?.name)}
      </div>
      {location ? (
        <div
          style={{
            display: "flex",
            marginTop: 8,
            fontFamily: "Marcellus",
            fontSize: 28,
            lineHeight: 1.2,
            color: LAGON,
          }}
        >
          {location}
        </div>
      ) : null}
      {hours.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
          {hours.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 12,
                paddingBottom: 12,
                borderTopWidth: 2,
                borderTopStyle: "solid",
                borderTopColor: LAGON,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontFamily: "Marcellus",
                  fontSize: 30,
                  color: OCEAN,
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  display: "flex",
                  fontFamily: "Inter",
                  fontWeight: 800,
                  fontSize: 32,
                  color: OCEAN,
                }}
              >
                {row.hours}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PhoneBand({ phone }: { phone: string | null }) {
  return (
    <div
      style={{
        width: WIDTH,
        height: 176,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: LAGON,
        color: SAND,
      }}
    >
      {phone ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Marcellus",
              fontSize: 26,
              lineHeight: 1,
            }}
          >
            Téléphone
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 84,
              lineHeight: 1,
              letterSpacing: 2,
            }}
          >
            {phone}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontFamily: "Marcellus", fontSize: 32 }}>
            Numéro non communiqué
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 42,
            }}
          >
            DSP 40 47 01 44
          </div>
        </div>
      )}
    </div>
  );
}

function PharmacyRows({ snap }: { snap: GardeMooreaSnapshot }) {
  const rows = gardePharmacyRows(snap);
  return (
    <div
      style={{
        width: WIDTH,
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        background: SAND,
        padding: "32px 48px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 1.2,
          color: OCEAN,
        }}
      >
        Pharmacies
      </div>
      {rows.map((pharmacy) => (
        <div
          key={pharmacy.id}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
            marginTop: 8,
            paddingTop: 12,
            borderTopWidth: 2,
            borderTopStyle: "solid",
            borderTopColor: LAGON,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Marcellus",
                fontSize: 34,
                color: OCEAN,
              }}
            >
              {pharmacy.name}
            </div>
            {pharmacy.onDuty ? (
              <div
                style={{
                  display: "flex",
                  background: OCEAN,
                  color: SAND,
                  fontFamily: "Inter",
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: 1,
                  padding: "8px 12px",
                }}
              >
                DE GARDE
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 28,
              color: OCEAN,
            }}
          >
            {pharmacy.phone}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 4,
              fontFamily: "Marcellus",
              fontSize: 24,
              color: LAGON,
            }}
          >
            {`sam. ${pharmacy.saturday}`}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 2,
              fontFamily: "Marcellus",
              fontSize: 24,
              color: LAGON,
            }}
          >
            {`dim. ${pharmacy.sunday}`}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeasonalBand({ validFrom }: { validFrom: string }) {
  const band = gardePosterSeason(validFrom);
  const campaign = band.label.length > 0;
  return (
    <div
      style={{
        width: WIDTH,
        height: campaign ? 92 : 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: band.background,
        color: band.color,
      }}
    >
      {campaign ? (
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 1,
          }}
        >
          {band.label}
        </div>
      ) : null}
    </div>
  );
}

function Credit({ snap }: { snap: GardeMooreaSnapshot }) {
  const dutySource = gardePosterDutySource(snap);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        background: SAND,
        padding: "26px 48px 22px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Marcellus",
          fontSize: 26,
          color: OCEAN,
        }}
      >
        {GARDE_IMAGE_CREDIT}
      </div>
      {dutySource ? (
        <div
          style={{
            display: "flex",
            marginTop: 6,
            fontFamily: "Marcellus",
            fontSize: 22,
            color: LAGON,
          }}
        >
          {`Pharmacie de garde : ${dutySource}`}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Marcellus",
            fontSize: 24,
            color: OCEAN,
          }}
        >
          Urgence vitale :
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 10,
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 28,
            color: OCEAN,
          }}
        >
          15
        </div>
      </div>
    </div>
  );
}

export function GardeWeekendPosterElement({ snap }: { snap: GardeMooreaSnapshot }) {
  return (
    <div
      style={{
        width: GARDE_WEEKEND_POSTER_SIZE.width,
        height: GARDE_WEEKEND_POSTER_SIZE.height,
        display: "flex",
        flexDirection: "column",
        background: SAND,
      }}
    >
      <DiamondFrieze />
      <div style={{ display: "flex", flexDirection: "row", background: SAND }}>
        <DateColumn validFrom={snap.validFrom} validTo={snap.validTo} />
        <TitleBlock snap={snap} />
      </div>
      <PhoneBand phone={gardePosterPhone(snap)} />
      <PharmacyRows snap={snap} />
      <SeasonalBand validFrom={snap.validFrom} />
      <Credit snap={snap} />
      <DiamondFrieze />
    </div>
  );
}

export { GARDE_WEEKEND_POSTER_SIZE };

export function posterHasDisplayContent(snap: GardeMooreaSnapshot): boolean {
  return Boolean(snap.doctor?.name);
}

let assetsCache: Promise<{
  fonts: { name: string; data: Buffer; weight: 400 | 700 | 800; style: "normal" }[];
}> | null = null;

/** Polices du site : Inter 800 pour titres et chiffres, Marcellus pour le texte. */
export function loadGardePosterAssets() {
  if (!assetsCache) {
    const dir = path.join(process.cwd(), "src/assets/fonts");
    const font = (file: string) => readFile(path.join(dir, file));
    assetsCache = Promise.all([
      font("Marcellus-400.woff"),
      font("Inter-400.woff"),
      font("Inter-700.woff"),
      font("Inter-800.woff"),
    ]).then(([marc, inter400, inter700, inter800]) => ({
      fonts: [
        { name: "Marcellus", data: marc, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: inter400, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: inter700, weight: 700 as const, style: "normal" as const },
        { name: "Inter", data: inter800, weight: 800 as const, style: "normal" as const },
      ],
    }));
  }
  return assetsCache;
}

export async function renderGardeWeekendPosterPng(snap: GardeMooreaSnapshot): Promise<Buffer> {
  const { fonts } = await loadGardePosterAssets();
  const res = new ImageResponse(GardeWeekendPosterElement({ snap }), {
    ...GARDE_WEEKEND_POSTER_SIZE,
    fonts,
  });
  return Buffer.from(await res.arrayBuffer());
}
