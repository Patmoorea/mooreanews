/**
 * Affiche garde week-end MooreaNews (1080×1620, Satori / next/og).
 * Gabarit bleu et blanc : paysage, cartes de dates, pilule téléphone,
 * trois pharmacies. Le rose n'est pas codé ici : il vient du bandeau
 * Octobre Rose (calendrier) et de l'illustration de ce seul mois.
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

export type GardePosterImages = {
  banner: string;
  hibiscus: string;
  frangipani: string;
  palm: string;
  roseRibbon: string;
  roseFigure: string;
};

function up(value: string): string {
  return value.toLocaleUpperCase("fr-FR");
}

function LogoMark() {
  return (
    <svg width={92} height={92} viewBox="0 0 92 92">
      <circle cx="46" cy="46" r="44" fill={BLUE} />
      <path
        d="M16 54 C28 34 40 40 48 50 C56 60 68 48 78 36"
        fill="none"
        stroke={WHITE}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d="M14 66 C30 50 44 58 54 66 C64 74 74 62 82 52"
        fill="none"
        stroke={WHITE}
        strokeWidth={6}
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
    <svg width={108} height={108} viewBox="0 0 108 108">
      <circle cx="54" cy="54" r="52" fill={BLUE} />
      <path
        d="M36 28 v18 c0 12 6 18 18 18 s18-6 18-18 V28"
        fill="none"
        stroke={WHITE}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle cx="36" cy="26" r="5" fill={WHITE} />
      <circle cx="72" cy="26" r="5" fill={WHITE} />
      <path d="M54 64 v10" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
      <circle cx="54" cy="82" r="9" fill="none" stroke={WHITE} strokeWidth={5} />
      <path d="M84 40 v14 M77 47 h14" stroke={WHITE} strokeWidth={4} strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32">
      <rect x="4" y="7" width="24" height="20" rx="3" fill="none" stroke={CYAN_DEEP} strokeWidth={2.4} />
      <path d="M4 13 h24" stroke={CYAN_DEEP} strokeWidth={2.4} />
      <path d="M11 4 v6 M21 4 v6" stroke={CYAN_DEEP} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="11" fill="none" stroke={CYAN_DEEP} strokeWidth={2.4} />
      <path d="M16 10 v7 l5 3" fill="none" stroke={CYAN_DEEP} strokeWidth={2.4} strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width={36} height={36} viewBox="0 0 32 32">
      <path
        d="M16 3 C10 3 6 8 6 13 c0 8 10 16 10 16 s10-8 10-16 c0-5-4-10-10-10 z"
        fill={CYAN_DEEP}
      />
      <circle cx="16" cy="13" r="4" fill={WHITE} />
    </svg>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg width={34} height={34} viewBox="0 0 32 32">
      <path
        d="M8 6 h5 l2 5 -3 2 a12 12 0 0 0 7 7 l2-3 5 2 v5 c0 1-1 3-3 3 C12 27 5 18 5 9 c0-2 1-3 3-3 z"
        fill={color}
      />
    </svg>
  );
}

function GreenCross() {
  return (
    <svg width={34} height={34} viewBox="0 0 36 36">
      <rect x="13" y="2" width="10" height="32" rx="2" fill={GREEN} />
      <rect x="2" y="13" width="32" height="10" rx="2" fill={GREEN} />
    </svg>
  );
}

function HeaderCross() {
  return (
    <svg width={36} height={36} viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill={WHITE} />
      <rect x="15" y="8" width="6" height="20" rx="1" fill={PHARM} />
      <rect x="8" y="15" width="20" height="6" rx="1" fill={PHARM} />
    </svg>
  );
}

function Header({ images }: { images: GardePosterImages }) {
  return (
    <div style={{ display: "flex", position: "relative", width: WIDTH, height: 248 }}>
      <img
        src={images.banner}
        width={WIDTH}
        height={196}
        style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 36,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Pacifico",
            fontSize: 30,
            color: WHITE,
            marginRight: 8,
          }}
        >
          {"Moorea au cœur de l'info"}
        </div>
        <Heart color={WHITE} size={18} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 28,
          bottom: 0,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <LogoMark />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 14 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 40,
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
              fontSize: 15,
              letterSpacing: 1.2,
              color: CYAN_DEEP,
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
    <div style={{ display: "flex", flexDirection: "column", padding: "8px 40px 0" }}>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <StethoscopeMark />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 18, flexGrow: 1 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 78,
              lineHeight: 0.92,
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
              marginTop: 6,
              background: CYAN,
              color: WHITE,
              borderRadius: 18,
              padding: "6px 22px 8px",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 52,
              lineHeight: 1,
              letterSpacing: 1,
            }}
          >
            DE GARDE
          </div>
        </div>
        <img src={hibiscus} width={168} height={158} style={{ objectFit: "contain" }} />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 4,
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 28,
          letterSpacing: 3,
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
          fontSize: 24,
          color: NAVY,
        }}
      >
        MooreaNews vous informe que le
      </div>
      <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 26,
            color: NAVY,
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 26,
            color: NAVY,
          }}
        >
          {" assurera la permanence médicale :"}
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
        padding: "14px 28px 0",
      }}
    >
      {cards.map((card, index) => (
        <div
          key={card.label}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: cards.length === 1 ? 640 : 478,
            marginLeft: index === 0 ? 0 : 16,
            background: WHITE,
            borderWidth: 3,
            borderStyle: "solid",
            borderColor: CARD_LINE,
            borderRadius: 22,
            padding: "14px 18px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
            <CalendarIcon />
            <div
              style={{
                display: "flex",
                marginLeft: 10,
                fontFamily: "Inter",
                fontWeight: 800,
                fontSize: 22,
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
                marginTop: 8,
              }}
            >
              <ClockIcon />
              <div
                style={{
                  display: "flex",
                  marginLeft: 10,
                  fontFamily: "Inter",
                  fontWeight: 800,
                  fontSize: 32,
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
        padding: "16px 40px 0",
      }}
    >
      {location ? (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", flexGrow: 1 }}>
          <PinIcon />
          <div
            style={{
              display: "flex",
              marginLeft: 8,
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: 26,
              color: NAVY,
              maxWidth: 460,
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
          padding: "14px 32px",
        }}
      >
        <PhoneIcon color={WHITE} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 12 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontWeight: 800,
              fontSize: phone ? 40 : 28,
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

function SeasonRibbon({ accent }: { accent: string }) {
  return (
    <svg width={78} height={88} viewBox="0 0 78 88">
      <path
        d="M24 8 C24 8 8 18 14 40 C18 54 30 48 34 36 C38 48 50 54 54 40 C60 18 44 8 44 8"
        fill="none"
        stroke={accent}
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path d="M30 40 L22 82 L36 62 L34 40" fill={accent} />
      <path d="M42 40 L54 82 L40 62 L40 40" fill={accent} />
    </svg>
  );
}

function SeasonFestive({ accent }: { accent: string }) {
  return (
    <svg width={78} height={88} viewBox="0 0 78 88">
      <path
        d="M39 8 L46 30 H70 L51 44 L58 68 L39 54 L20 68 L27 44 L8 30 H32 Z"
        fill={accent}
      />
    </svg>
  );
}

function SeasonCare({ accent }: { accent: string }) {
  return (
    <svg width={78} height={88} viewBox="0 0 78 88">
      <circle cx="39" cy="44" r="30" fill={accent} />
      <rect x="33" y="24" width="12" height="40" rx="2" fill={WHITE} />
      <rect x="19" y="38" width="40" height="12" rx="2" fill={WHITE} />
    </svg>
  );
}

function SeasonArtwork({
  id,
  accent,
  images,
}: {
  id: GardeSeasonId;
  accent: string;
  images: GardePosterImages;
}) {
  switch (id) {
    case "octobre-rose":
      return (
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <img src={images.roseRibbon} width={78} height={86} style={{ objectFit: "contain" }} />
          <div style={{ display: "flex", width: 8 }} />
          <img src={images.roseFigure} width={150} height={78} style={{ objectFit: "contain" }} />
        </div>
      );
    case "novembre-bleu":
      return <SeasonRibbon accent={accent} />;
    case "fetes":
      return <SeasonFestive accent={accent} />;
    case "neutral":
      return <SeasonCare accent={accent} />;
    default: {
      const unreachable: never = id;
      return unreachable;
    }
  }
}

function TaglineSeason({ snap, images }: { snap: GardeMooreaSnapshot; images: GardePosterImages }) {
  const band = gardePosterSeason(snap.validFrom);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "12px 36px 4px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", flexGrow: 1 }}>
        <div
          style={{
            display: "flex",
            fontFamily: "Great Vibes",
            fontSize: 40,
            color: NAVY,
            lineHeight: 1.1,
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
          width: band.id === "octobre-rose" ? 520 : 420,
        }}
      >
        {band.id === "octobre-rose" ? (
          <img src={images.roseRibbon} width={72} height={80} style={{ objectFit: "contain" }} />
        ) : (
          <SeasonArtwork id={band.id} accent={band.background} images={images} />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexGrow: 1,
            marginLeft: 8,
            marginRight: 8,
          }}
        >
          {band.label ? (
            <div
              style={{
                display: "flex",
                fontFamily: "Great Vibes",
                fontSize: 36,
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
                marginTop: band.label ? 4 : 0,
                fontFamily: "Inter",
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: 0.6,
                color: NAVY,
                textAlign: "center",
              }}
            >
              {up(band.subtitle)}
            </div>
          ) : null}
        </div>
        {band.id === "octobre-rose" ? (
          <img src={images.roseFigure} width={132} height={72} style={{ objectFit: "contain" }} />
        ) : null}
      </div>
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
        width: 312,
        background: WHITE,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: CARD_LINE,
        borderRadius: 16,
        padding: "12px 12px 40px",
        marginLeft: 8,
        marginRight: 8,
        position: "relative",
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
          fontSize: 16,
          color: NAVY,
          lineHeight: 1.15,
        }}
      >
        {up(pharmacy.name)}
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: 8 }}>
        <PhoneIcon color={CYAN_DEEP} />
        <div
          style={{
            display: "flex",
            marginLeft: 6,
            fontFamily: "Inter",
            fontWeight: 800,
            fontSize: 18,
            color: NAVY,
          }}
        >
          {pharmacy.phone}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "row", marginTop: 8 }}>
        <CalendarIcon />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 6 }}>
          <div style={{ display: "flex", fontFamily: "Inter", fontSize: 15, color: NAVY }}>
            {`Samedi : ${pharmacy.saturday}`}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 3,
              fontFamily: "Inter",
              fontSize: 15,
              color: NAVY,
            }}
          >
            {`Dimanche : ${pharmacy.sunday}`}
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 10, bottom: 8, display: "flex" }}>
        <GreenCross />
      </div>
    </div>
  );
}

function Pharmacies({ snap }: { snap: GardeMooreaSnapshot }) {
  const rows = gardePharmacyRows(snap);
  return (
    <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "10px 28px 0" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
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
              fontSize: 30,
              letterSpacing: 1.4,
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
            justifyContent: "center",
            padding: "14px 8px 18px",
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
        padding: "8px 32px 2px",
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
  const marks = Array.from({ length: 18 }, (_, index) => {
    const x = index * 62;
    return `${x},44 ${x + 18},10 ${x + 36},44`;
  });
  return (
    <svg width={WIDTH} height={48} viewBox={`0 0 ${WIDTH} 48`}>
      {marks.map((points) => (
        <polygon key={points} points={points} fill="rgba(255,255,255,0.18)" />
      ))}
    </svg>
  );
}

function Footer({ images }: { images: GardePosterImages }) {
  return (
    <div style={{ display: "flex", position: "relative", width: WIDTH, height: 214, background: FOOTER }}>
      <svg width={WIDTH} height={46} viewBox={`0 0 ${WIDTH} 46`} style={{ position: "absolute", top: 0, left: 0 }}>
        <path
          d={`M0,0 H${WIDTH} V18 C900,42 720,4 540,22 C360,40 180,6 0,26 Z`}
          fill={WHITE}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Great Vibes",
              fontSize: 36,
              color: WHITE,
              lineHeight: 1.1,
            }}
          >
            Ensemble pour une population en bonne santé
          </div>
        </div>
        <Heart color={WHITE} size={16} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 8, display: "flex" }}>
        <TribalBand />
      </div>
      <img
        src={images.palm}
        width={210}
        height={108}
        style={{ position: "absolute", left: -6, bottom: 0, objectFit: "contain" }}
      />
      <img
        src={images.frangipani}
        width={92}
        height={92}
        style={{ position: "absolute", left: 12, bottom: 4, objectFit: "contain" }}
      />
      <svg width={220} height={90} viewBox="0 0 220 90" style={{ position: "absolute", right: 8, bottom: 18 }}>
        <path d="M0 78 L40 40 L70 62 L110 18 L150 58 L190 34 L220 70 L220 90 L0 90 Z" fill={WAVE} />
        <path d="M150 70 C150 50 168 38 168 38 C168 38 186 50 186 70" fill="none" stroke={WHITE} strokeWidth={3} />
        <path d="M158 46 L168 28 L178 46" fill={WHITE} />
        <path d="M168 70 V38" stroke={WHITE} strokeWidth={3} />
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
      <TaglineSeason snap={snap} images={images} />
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
      png("octobre-rose-ribbon.png"),
      png("octobre-rose-figure.png"),
    ]).then(([marc, inter400, inter700, inter800, pacifico, vibes, banner, hibiscus, frangipani, palm, roseRibbon, roseFigure]) => ({
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
        roseRibbon: pngDataUrl(roseRibbon),
        roseFigure: pngDataUrl(roseFigure),
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
