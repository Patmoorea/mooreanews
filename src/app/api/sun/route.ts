import { NextResponse } from "next/server";
import { MOOREA_COORDS } from "@/lib/constants";

export const revalidate = 21600; // 6 heures

type SunResponse = {
  results: {
    sunrise: string;
    sunset: string;
    solar_noon: string;
    day_length: string;
  };
  status: string;
};

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://api.sunrise-sunset.org/json?lat=${MOOREA_COORDS.lat}&lng=${MOOREA_COORDS.lon}&date=${today}&formatted=0`;
    const res = await fetch(url, { next: { revalidate: 21600 } });
    if (!res.ok) throw new Error(`Sun API ${res.status}`);

    const data: SunResponse = await res.json();
    return NextResponse.json({
      sunrise: data.results.sunrise,
      sunset: data.results.sunset,
      noon: data.results.solar_noon,
      dayLength: data.results.day_length,
      moonPhase: getMoonPhase(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 500 }
    );
  }
}

/** Calcul approximatif de la phase de lune (0 = nouvelle, 0.5 = pleine) */
function getMoonPhase() {
  const synodicMonth = 29.53058867;
  const newMoonRef = new Date("2000-01-06T18:14:00Z").getTime();
  const now = Date.now();
  const days = (now - newMoonRef) / (1000 * 60 * 60 * 24);
  const phase = (days % synodicMonth) / synodicMonth;

  const phases = [
    { name: "Nouvelle lune", emoji: "🌑", min: 0, max: 0.05 },
    { name: "Premier croissant", emoji: "🌒", min: 0.05, max: 0.22 },
    { name: "Premier quartier", emoji: "🌓", min: 0.22, max: 0.28 },
    { name: "Lune gibbeuse croissante", emoji: "🌔", min: 0.28, max: 0.47 },
    { name: "Pleine lune", emoji: "🌕", min: 0.47, max: 0.53 },
    { name: "Lune gibbeuse décroissante", emoji: "🌖", min: 0.53, max: 0.72 },
    { name: "Dernier quartier", emoji: "🌗", min: 0.72, max: 0.78 },
    { name: "Dernier croissant", emoji: "🌘", min: 0.78, max: 0.95 },
    { name: "Nouvelle lune", emoji: "🌑", min: 0.95, max: 1 },
  ];

  const current = phases.find((p) => phase >= p.min && phase < p.max) ?? phases[0];
  return {
    phase: Math.round(phase * 100) / 100,
    illumination: Math.round((1 - Math.abs(phase - 0.5) * 2) * 100),
    name: current.name,
    emoji: current.emoji,
  };
}
