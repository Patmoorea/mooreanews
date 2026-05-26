import { NextResponse } from "next/server";
import { MOOREA_COORDS } from "@/lib/constants";

export const revalidate = 600; // 10 minutes

type OWMResponse = {
  main: { temp: number; feels_like: number; humidity: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  wind: { speed: number };
  name: string;
};

export async function GET() {
  const key = process.env.OPENWEATHERMAP_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "OPENWEATHERMAP_API_KEY non configurée" },
      { status: 503 }
    );
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${MOOREA_COORDS.lat}&lon=${MOOREA_COORDS.lon}&units=metric&lang=fr&appid=${key}`;
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`OWM ${res.status}`);

    const data: OWMResponse = await res.json();
    return NextResponse.json({
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windKmh: Math.round(data.wind.speed * 3.6),
      condition: data.weather[0]?.description ?? "",
      icon: data.weather[0]?.icon ?? "01d",
      conditionMain: data.weather[0]?.main ?? "",
      location: data.name,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 500 }
    );
  }
}
