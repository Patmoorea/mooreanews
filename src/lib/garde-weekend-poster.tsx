/**
 * Affiche garde week-end MooreaNews (1080×1620, Satori / next/og).
 * Gabarit bleu et blanc : paysage, cartes de dates, pilule téléphone,
 * trois pharmacies. Le rose n'est pas codé ici : il vient du bandeau
 * Octobre Rose (calendrier). Le ruban et la silhouette sont des SVG.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { GardeSeasonId } from "@/data/garde-seasonal-calendar";
import type { GardeMooreaSnapshot } from "@/lib/garde-moorea-auto";
import {
  GARDE_IMAGE_CREDIT,
  GARDE_WEEKEND_POSTER_SIZE,
  gardePharmacyRows,
  gardePosterDayCards,
  gardePosterDoctorName,
  gardePosterDutySource,
  gardePosterLocation,
  gardePosterPhone,
  gardePosterSeason,
  type GardePosterDayCard,
  type GardePosterPharmacyRow,
} from "@/lib/garde-weekend-poster-model";

const NAVY = "#012C76";
const BLUE = "#0068A8";
const CYAN = "#00B0C8";
const CYAN_DEEP = "#0088C0";
const SKY = "#E7F6FB";
const CARD_LINE = "#8FD0EA";
const GREEN = "#1F9D45";
const WHITE = "#FFFFFF";
const FOOTER = "#0058A0";
const PHARM = "#005090";
const MUTED = "#4E7194";
const WAVE = "#D6EEF8";

const WIDTH = GARDE_WEEKEND_POSTER_SIZE.width;
const HEADER_H = 300;
const PHOTO_H = 300;

export type GardePosterImages = {
  banner: string;
  hibiscus: string;
  frangipani: string;
  palm: string;
};

function up(value: string): string {
  return value.toLocaleUpperCase("fr-FR");
}

function splitConfirm(value: string): { hours: string; note: string | null } {
  const match = /^(.*?)\s*\(à confirmer\)\s*$/.exec(value);
  if (!match?.[1]) return { hours: value, note: null };
  return { hours: match[1].trim(), note: "(à confirmer)" };
}

function LogoMark() {
  return (
    <svg width={124} height={124} viewBox="0 0 108 108">
      <circle cx="54" cy="54" r="52" fill={BLUE} />
      <path
        d="M18 62 C34 38 48 46 58 58 C68 70 82 56 92 42"
        fill="none"
        stroke={WHITE}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path
        d="M16 76 C36 56 52 66 64 76 C76 86 88 72 96 60"
        fill="none"
        stroke={WHITE}
        strokeWidth={7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function Heart({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        d="M12 20 C4 13 3 8 7 5.5 C9.2 4.2 11 5.2 12 7 C13 5.2 14.8 4.2 17 5.5 C21 8 20 13 12 20 Z"
        fill={color}
      />
    </svg>
  );
}

function StethoscopeMark() {
  return (
    <svg width={124} height={124} viewBox="0 0 124 124">
      <circle cx="62" cy="62" r="60" fill={BLUE} />
      <path
        d="M40 32 v22 c0 14 8 22 22 22 s22-8 22-22 V32"
        fill="none"
        stroke={WHITE}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle cx="40" cy="30" r="6" fill={WHITE} />
      <circle cx="84" cy="30" r="6" fill={WHITE} />
      <path d="M62 76 v12" stroke={WHITE} strokeWidth={6} strokeLinecap="round" />
      <circle cx="62" cy="98" r="11" fill="none" stroke={WHITE} strokeWidth={6} />
      <path d="M98 46 v16 M90 54 h16" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="3" y="6" width="26" height="22" rx="3" fill="none" stroke={CYAN_DEEP} strokeWidth={2.6} />
      <path d="M3 13 h26" stroke={CYAN_DEEP} strokeWidth={2.6} />
      <path d="M11 3 v7 M21 3 v7" stroke={CYAN_DEEP} strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="12" fill="none" stroke={CYAN_DEEP} strokeWidth={2.6} />
      <path d="M16 9 v8 l5 3" fill="none" stroke={CYAN_DEEP} strokeWidth={2.6} strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width={46} height={46} viewBox="0 0 32 32">
      <path
        d="M16 3 C10 3 6 8 6 13 c0 8 10 16 10 16 s10-8 10-16 c0-5-4-10-10-10 z"
        fill={CYAN_DEEP}
      />
      <circle cx="16" cy="13" r="4" fill={WHITE} />
    </svg>
  );
}

function PhoneIcon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path
        d="M8 6 h5 l2 5 -3 2 a12 12 0 0 0 7 7 l2-3 5 2 v5 c0 1-1 3-3 3 C12 27 5 18 5 9 c0-2 1-3 3-3 z"
        fill={color}
      />
    </svg>
  );
}

function GreenCross() {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <rect x="13" y="2" width="10" height="32" rx="2" fill={GREEN} />
      <rect x="2" y="13" width="32" height="10" rx="2" fill={GREEN} />
    </svg>
  );
}

function HeaderCross() {
  return (
    <svg width={40} height={40} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill={WHITE} />
      <rect x="15" y="8" width="6" height="20" rx="1" fill={PHARM} />
      <rect x="8" y="15" width="20" height="6" rx="1" fill={PHARM} />
    </svg>
  );
}

function AwarenessRibbon({ color }: { color: string }) {
  return (
    <svg width={74} height={90} viewBox="0 0 90 110">
      <g fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M45 16 C30 8 12 18 14 36 C16 50 32 52 42 40" />
        <path d="M45 16 C60 8 78 18 76 36 C74 50 58 52 48 40" />
        <path d="M36 44 C30 58 24 78 18 100" />
        <path d="M54 44 C60 58 66 78 72 100" />
        <path d="M24 84 L45 68 L66 96" />
      </g>
    </svg>
  );
}

function WomanSilhouette({ color }: { color: string }) {
  return (
    <svg width={86} height={100} viewBox="0 0 90 110">
      <g fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M58 30 C62 16 46 8 36 18 C28 12 20 20 24 30" />
        <path d="M24 30 C16 34 14 42 20 48 C14 52 18 60 28 64 C38 68 50 62 54 52" />
        <path d="M42 64 C40 74 38 82 36 90" />
        <path d="M36 90 C22 96 10 106 6 110" />
        <path d="M50 66 C64 76 78 90 86 104" />
        <path d="M34 20 C46 10 60 16 58 28" />
        <circle cx="16" cy="24" r="5" />
        <circle cx="24" cy="16" r="4" />
        <circle cx="9" cy="16" r="3.4" />
        <circle cx="10" cy="28" r="3" />
      </g>
      <circle cx="16" cy="24" r="1.7" fill={color} />
    </svg>
  );
}

function SeasonFestive({ color }: { color: string }) {
  return (
    <svg width={68} height={82} viewBox="0 0 68 82">
      <path
        d="M34 8 L42 32 H68 L47 46 L55 72 L34 56 L13 72 L21 46 L0 32 H26 Z"
        fill={color}
      />
    </svg>
  );
}

function SeasonCare({ color }: { color: string }) {
  return (
    <svg width={68} height={82} viewBox="0 0 68 82">
      <circle cx="34" cy="41" r="26" fill={color} />
      <rect x="29" y="22" width="10" height="38" rx="2" fill={WHITE} />
      <rect x="16" y="36" width="36" height="10" rx="2" fill={WHITE} />
    </svg>
  );
}

function SeasonMark({ id, color }: { id: GardeSeasonId; color: string }) {
  switch (id) {
    case "octobre-rose":
      return <AwarenessRibbon color={color} />;
    case "novembre-bleu":
      return <AwarenessRibbon color={color} />;
    case "fetes":
      return <SeasonFestive color={color} />;
    case "neutral":
      return <SeasonCare color={color} />;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

function Header({ images }: { images: GardePosterImages }) {
  const script = "Moorea au cœur de l'info";
  return (
    <div style={{ display: "flex", position: "relative", width: WIDTH, height: HEADER_H, flexShrink: 0 }}>
      <img
        src={images.banner}
        width={WIDTH}
        height={PHOTO_H}
        style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
      />
      <svg
        width={WIDTH}
        height={36}
        viewBox={`0 0 ${WIDTH} 36`}
        style={{ position: "absolute", left: 0, top: HEADER_H - 28 }}
      >
        <path
          d={`M0 16 C180 34 380 4 560 16 C760 30 920 6 ${WIDTH} 14 L${WIDTH} 36 L0 36 Z`}
          fill={WHITE}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 28,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", position: "relative" }}>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 2,
              left: 2,
              fontFamily: "Pacifico",
              fontSize: 34,
              color: NAVY,
            }}
          >
            {script}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Pacifico",
              fontSize: 34,
              color: WHITE,
              marginRight: 8,
            }}
          >
            {script}
          </div>
        </div>
        <Heart color={WHITE} size={22} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 26,
          bottom: 46,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <LogoMark />
        <div style={{ display: "flex", position: "relative", flexDirection: "column", marginLeft: 14 }}>
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 2,
              left: 2,
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Inter",
                fontWeight: 800,
                fontSize: 46,
                color: NAVY,
                lineHeight: 1,
              }}
            >
              MooreaNews.com
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 6,
                fontFamily: "Inter",
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: 1.3,
                color: NAVY,
              }}
            >
              INFOS LOCALES • ACTUALITÉS • POLYNÉSIE
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 46,
              color: WHITE,
              lineHeight: 1,
            }}
          >
            MooreaNews.com
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 6,
              fontFamily: "Inter",
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: 1.3,
              color: WHITE,
            }}
          >
            INFOS LOCALES • ACTUALITÉS • POLYNÉSIE
          </div>
        </div>
      </div>
    </div>
  );
}

function TitleBlock({ snap, hibiscus }: { snap: GardeMooreaSnapshot; hibiscus: string }) {
  const name = gardePosterDoctorName(snap.doctor?.name);
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "4px 36px 0", flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <StethoscopeMark />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 16, flexGrow: 1 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 86,
              lineHeight: 0.9,
              color: NAVY,
              letterSpacing: 1,
            }}
          >
            MÉDECIN
          </div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              marginTop: 8,
              background: CYAN,
              color: WHITE,
              borderRadius: 20,
              padding: "8px 26px 10px",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: 1.2,
            }}
          >
            DE GARDE
          </div>
        </div>
        <img src={hibiscus} width={176} height={166} style={{ objectFit: "contain" }} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 6,
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 4,
          color: CYAN,
        }}
      >
        - MOOREA -
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 8,
          fontFamily: "Inter",
          fontSize: 26,
          color: NAVY,
        }}
      >
        MooreaNews vous informe que le
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 28,
            color: NAVY,
          }}
        >
          {name}
        </div>
        <div style={{ display: "flex", width: 10 }} />
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 28,
            color: NAVY,
          }}
        >
          assurera la permanence médicale :
        </div>
      </div>
    </div>
  );
}

function DateCards({ cards }: { cards: GardePosterDayCard[] }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        padding: "16px 28px 0",
        flexShrink: 0,
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.label}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: cards.length === 1 ? 680 : 492,
            marginLeft: index === 0 ? 0 : 20,
            background: WHITE,
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: CARD_LINE,
            borderRadius: 26,
            padding: "20px 24px 22px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <CalendarIcon size={44} />
            <div
              style={{
                display: "flex",
                marginLeft: 12,
                fontFamily: "Inter",
                fontWeight: 800,
                fontSize: 28,
                color: CYAN_DEEP,
              }}
            >
              {up(card.label)}
            </div>
          </div>
          {card.hours ? (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <ClockIcon size={44} />
              <div
                style={{
                  display: "flex",
                  marginLeft: 12,
                  fontFamily: "Inter",
                  fontWeight: 800,
                  fontSize: 42,
                  color: NAVY,
                }}
              >
                {card.hours}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LocationPhone({ snap }: { snap: GardeMooreaSnapshot }) {
  const location = gardePosterLocation(snap);
  const phone = gardePosterPhone(snap);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "18px 36px 0",
        flexShrink: 0,
      }}
    >
      {location ? (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", flexGrow: 1 }}>
          <PinIcon />
          <div
            style={{
              display: "flex",
              marginLeft: 10,
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 28,
              color: NAVY,
              maxWidth: 480,
            }}
          >
            {location}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexGrow: 1 }} />
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: BLUE,
          borderRadius: 999,
          padding: phone ? "16px 36px" : "12px 28px",
        }}
      >
        <PhoneIcon color={WHITE} size={40} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: phone ? 46 : 30,
              color: WHITE,
              letterSpacing: 1,
              lineHeight: 1,
            }}
          >
            {phone ?? "40 47 01 44"}
          </div>
          {phone ? null : (
            <div
              style={{
                display: "flex",
                marginTop: 4,
                fontFamily: "Inter",
                fontSize: 16,
                color: WHITE,
              }}
            >
              DSP — numéro non communiqué
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaglineSeason({ snap }: { snap: GardeMooreaSnapshot }) {
  const band = gardePosterSeason(snap.validFrom);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "16px 32px 0",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", flexGrow: 1, flexShrink: 1, marginRight: 12 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Great Vibes",
            fontSize: 56,
            color: NAVY,
            lineHeight: 1.05,
          }}
        >
          Votre santé notre priorité !
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          background: band.surface,
          borderRadius: 22,
          padding: "10px 16px 12px 12px",
          flexShrink: 0,
        }}
      >
        <SeasonMark id={band.id} color={band.background} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginLeft: 8,
            marginRight: band.id === "octobre-rose" ? 8 : 4,
          }}
        >
          {band.label ? (
            <div
              style={{
                display: "flex",
                fontFamily: "Great Vibes",
                fontSize: 34,
                color: band.background,
                lineHeight: 1,
              }}
            >
              {band.label}
            </div>
          ) : null}
          {band.subtitle ? (
            <div
              style={{
                display: "flex",
                marginTop: band.label ? 2 : 0,
                fontFamily: "Inter",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: 0.4,
                color: band.background,
                textAlign: "center",
              }}
            >
              {up(band.subtitle)}
            </div>
          ) : null}
        </div>
        {band.id === "octobre-rose" ? <WomanSilhouette color={band.background} /> : null}
      </div>
    </div>
  );
}

function HourLine({ label, value }: { label: string; value: string }) {
  const { hours, note } = splitConfirm(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 3 }}>
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          style={{
            display: "flex",
            width: 116,
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 18,
            color: NAVY,
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: "flex",
            width: 130,
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1.2,
            color: NAVY,
          }}
        >
          {hours}
        </div>
      </div>
      {note ? (
        <div
          style={{
            display: "flex",
            marginLeft: 116,
            marginTop: 1,
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: 13,
            color: MUTED,
          }}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
}

function PharmacyCard({ pharmacy }: { pharmacy: GardePosterPharmacyRow }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        flexBasis: 0,
        background: WHITE,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: CARD_LINE,
        borderRadius: 16,
        padding: "16px 12px 16px",
        marginLeft: 7,
        marginRight: 7,
      }}
    >
      {pharmacy.onDuty ? (
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: GREEN,
            color: WHITE,
            borderRadius: 8,
            padding: "3px 8px",
            marginBottom: 6,
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 0.8,
          }}
        >
          DE GARDE
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 20,
          color: NAVY,
          lineHeight: 1.15,
        }}
      >
        {up(pharmacy.name)}
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <PhoneIcon color={CYAN_DEEP} size={26} />
        <div
          style={{
            display: "flex",
            marginLeft: 6,
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 24,
            color: NAVY,
          }}
        >
          {pharmacy.phone}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", marginTop: 8 }}>
        <CalendarIcon size={24} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 6 }}>
          <HourLine label="Samedi :" value={pharmacy.saturday} />
          <HourLine label="Dimanche :" value={pharmacy.sunday} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <GreenCross />
      </div>
    </div>
  );
}

function Pharmacies({ snap }: { snap: GardeMooreaSnapshot }) {
  const rows = gardePharmacyRows(snap);
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "18px 28px 0", flexShrink: 0 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: SKY,
          borderRadius: 26,
          overflow: "hidden",
          borderWidth: 3,
          borderStyle: "solid",
          borderColor: PHARM,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            background: PHARM,
            padding: "12px 16px",
          }}
        >
          <HeaderCross />
          <div
            style={{
              display: "flex",
              marginLeft: 12,
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 32,
              letterSpacing: 1.5,
              color: WHITE,
            }}
          >
            HORAIRES DES PHARMACIES
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            padding: "16px 8px 18px",
          }}
        >
          {rows.map((pharmacy) => (
            <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Credit({ snap }: { snap: GardeMooreaSnapshot }) {
  const duty = gardePosterDutySource(snap);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 32px 0",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", fontFamily: "Inter", fontSize: 16, color: MUTED }}>
        {GARDE_IMAGE_CREDIT}
      </div>
      {duty ? (
        <div
          style={{
            display: "flex",
            marginTop: 2,
            fontFamily: "Inter",
            fontSize: 14,
            color: MUTED,
          }}
        >
          {`Pharmacie de garde : ${duty}`}
        </div>
      ) : null}
    </div>
  );
}

function TribalBand() {
  const up = Array.from({ length: 16 }, (_, index) => {
    const x = index * 70;
    return `${x},58 ${x + 24},8 ${x + 48},58`;
  });
  const down = Array.from({ length: 16 }, (_, index) => {
    const x = 24 + index * 70;
    return `${x},6 ${x + 20},42 ${x + 40},6`;
  });
  return (
    <svg width={WIDTH} height={62} viewBox={`0 0 ${WIDTH} 62`}>
      {up.map((points) => (
        <polygon key={`u-${points}`} points={points} fill="rgba(255,255,255,0.95)" />
      ))}
      {down.map((points) => (
        <polygon key={`d-${points}`} points={points} fill="rgba(255,255,255,0.72)" />
      ))}
    </svg>
  );
}

function Footer({ images }: { images: GardePosterImages }) {
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: WIDTH,
        height: 228,
        background: FOOTER,
        flexShrink: 0,
        marginTop: "auto",
      }}
    >
      <svg width={WIDTH} height={52} viewBox={`0 0 ${WIDTH} 52`} style={{ position: "absolute", top: 0, left: 0 }}>
        <path
          d={`M0 0 H${WIDTH} V16 C920 48 740 2 540 24 C340 46 160 4 0 28 Z`}
          fill={WHITE}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 150,
          right: 160,
          top: 36,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Great Vibes",
            fontSize: 40,
            color: WHITE,
            lineHeight: 1.05,
          }}
        >
          Ensemble pour une population en bonne santé
        </div>
        <Heart color={WHITE} size={18} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 6, display: "flex" }}>
        <TribalBand />
      </div>
      <img
        src={images.palm}
        width={340}
        height={168}
        style={{ position: "absolute", left: -16, bottom: -4, objectFit: "contain" }}
      />
      <img
        src={images.palm}
        width={180}
        height={110}
        style={{ position: "absolute", right: 150, bottom: 8, objectFit: "contain" }}
      />
      <img
        src={images.frangipani}
        width={118}
        height={118}
        style={{ position: "absolute", left: 18, bottom: 10, objectFit: "contain" }}
      />
      <svg width={240} height={100} viewBox="0 0 240 100" style={{ position: "absolute", right: 6, bottom: 22 }}>
        <path d="M0 86 L46 42 L78 66 L124 16 L168 60 L206 34 L240 72 L240 100 L0 100 Z" fill={WAVE} />
        <path d="M168 74 C168 50 190 36 190 36 C190 36 212 50 212 74" fill="none" stroke={WHITE} strokeWidth={3} />
        <path d="M178 48 L190 26 L202 48" fill={WHITE} />
        <path d="M190 74 V40" stroke={WHITE} strokeWidth={3} />
      </svg>
    </div>
  );
}

export function GardeWeekendPosterElement({
  snap,
  images,
}: {
  snap: GardeMooreaSnapshot;
  images: GardePosterImages;
}) {
  return (
    <div
      style={{
        width: GARDE_WEEKEND_POSTER_SIZE.width,
        height: GARDE_WEEKEND_POSTER_SIZE.height,
        display: "flex",
        flexDirection: "column",
        background: WHITE,
      }}
    >
      <Header images={images} />
      <TitleBlock snap={snap} hibiscus={images.hibiscus} />
      <DateCards cards={gardePosterDayCards(snap)} />
      <LocationPhone snap={snap} />
      <TaglineSeason snap={snap} />
      <Pharmacies snap={snap} />
      <Credit snap={snap} />
      <Footer images={images} />
    </div>
  );
}

export { GARDE_WEEKEND_POSTER_SIZE };

export function posterHasDisplayContent(snap: GardeMooreaSnapshot): boolean {
  return Boolean(snap.doctor?.name);
}

type LoadedAssets = {
  fonts: { name: string; data: Buffer; weight: 400 | 700 | 800; style: "normal" }[];
  images: GardePosterImages;
};

let assetsCache: Promise<LoadedAssets> | null = null;

function pngDataUrl(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/** Polices du site, plus deux scripts pour le bandeau et les slogans. */
export function loadGardePosterAssets() {
  if (!assetsCache) {
    const fontsDir = path.join(process.cwd(), "src/assets/fonts");
    const imgDir = path.join(process.cwd(), "src/assets/garde");
    const font = (file: string) => readFile(path.join(fontsDir, file));
    const png = (file: string) => readFile(path.join(imgDir, file));
    assetsCache = Promise.all([
      font("Marcellus-400.woff"),
      font("Inter-400.woff"),
      font("Inter-700.woff"),
      font("Inter-800.woff"),
      font("Pacifico-Regular.ttf"),
      font("GreatVibes-Regular.ttf"),
      png("lagoon-banner.png"),
      png("hibiscus.png"),
      png("frangipani.png"),
      png("palm-leaves.png"),
    ]).then(([marc, inter400, inter700, inter800, pacifico, vibes, banner, hibiscus, frangipani, palm]) => ({
      fonts: [
        { name: "Marcellus", data: marc, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: inter400, weight: 400 as const, style: "normal" as const },
        { name: "Inter", data: inter700, weight: 700 as const, style: "normal" as const },
        { name: "Inter", data: inter800, weight: 800 as const, style: "normal" as const },
        { name: "Pacifico", data: pacifico, weight: 400 as const, style: "normal" as const },
        { name: "Great Vibes", data: vibes, weight: 400 as const, style: "normal" as const },
      ],
      images: {
        banner: pngDataUrl(banner),
        hibiscus: pngDataUrl(hibiscus),
        frangipani: pngDataUrl(frangipani),
        palm: pngDataUrl(palm),
      },
    }));
  }
  return assetsCache;
}

export async function renderGardeWeekendPosterPng(snap: GardeMooreaSnapshot): Promise<Buffer> {
  const { fonts, images } = await loadGardePosterAssets();
  const res = new ImageResponse(GardeWeekendPosterElement({ snap, images }), {
    ...GARDE_WEEKEND_POSTER_SIZE,
    fonts,
  });
  return Buffer.from(await res.arrayBuffer());
}
