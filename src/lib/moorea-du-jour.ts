/**
 * Agrégation « Moorea du jour » — résumé quotidien pour accueil, app et digest.
 */

import { expirePastAlerts } from "@/lib/alert-schedule";
import {
  getArticles,
  getFeaturedArticles,
  getUpcomingEvents,
  getRestaurants,
} from "@/lib/content";
import { getNextDepartures } from "@/lib/ferries";
import { isOpenNow } from "@/lib/open-now";
import { dbListActiveAlerts } from "@/lib/supabase/queries";
import { getSwimConditions } from "@/lib/swim-conditions";
import { getTides } from "@/lib/tides";
import { getCurrentWeather } from "@/lib/weather";
import { SITE } from "@/lib/constants";

export type MooreaDuJour = {
  generatedAt: string;
  siteUrl: string;
  alerts: { count: number; items: { id: string; title: string; urgent: boolean }[] };
  weather: { temp: number; description: string; windKmh: number; icon: string };
  swim: ReturnType<typeof getSwimConditions>;
  tides: { time: string; type: string }[];
  ferries: {
    fromMoorea: { time: string; company: string; minutesUntil: number }[];
    fromTahiti: { time: string; company: string; minutesUntil: number }[];
  };
  todayEvents: { slug: string; title: string; time?: string; location: string }[];
  weekendEvents: { slug: string; title: string; date: string; location: string }[];
  openRestaurants: { slug: string; name: string; district: string }[];
  headlines: { slug: string; title: string; category: string }[];
};

function tahitiDateIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Tahiti",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function weekendRange(): { start: string; end: string } {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Pacific/Tahiti" }),
  );
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(friday), end: fmt(sunday) };
}

export async function getMooreaDuJour(): Promise<MooreaDuJour> {
  await expirePastAlerts();
  const [weather, ferries, alertsRows, events, restaurants, featured] =
    await Promise.all([
      getCurrentWeather(),
      getNextDepartures(),
      dbListActiveAlerts(),
      getUpcomingEvents(20),
      getRestaurants(),
      getFeaturedArticles(),
    ]);

  const swim = getSwimConditions(weather);
  const tides = getTides();
  const today = tahitiDateIso();
  const { start: wStart, end: wEnd } = weekendRange();

  const alerts = (alertsRows ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    urgent: a.urgent,
  }));

  const todayEvents = events
    .filter((e) => e.date === today)
    .slice(0, 3)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      time: e.time,
      location: e.location,
    }));

  const weekendEvents = events
    .filter((e) => e.date >= wStart && e.date <= wEnd)
    .slice(0, 6)
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      date: e.date,
      location: e.location,
    }));

  const openRestaurants = restaurants
    .filter((r) => isOpenNow(r.openingHours) === true)
    .slice(0, 6)
    .map((r) => ({ slug: r.slug, name: r.name, district: r.district }));

  const articles = featured.length > 0 ? featured : await getArticles();
  const headlines = articles.slice(0, 4).map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
  }));

  return {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE.url.replace(/\/$/, ""),
    alerts: { count: alerts.length, items: alerts.slice(0, 5) },
    weather: {
      temp: Math.round(weather.temp),
      description: weather.description,
      windKmh: Math.round(weather.windSpeed),
      icon: weather.icon,
    },
    swim,
    tides: tides.tides.slice(0, 2).map((t) => ({ time: t.time, type: t.type })),
    ferries: {
      fromMoorea: ferries.fromMoorea.slice(0, 3).map((d) => ({
        time: d.time,
        company: d.company,
        minutesUntil: d.minutesUntil,
      })),
      fromTahiti: ferries.fromTahiti.slice(0, 3).map((d) => ({
        time: d.time,
        company: d.company,
        minutesUntil: d.minutesUntil,
      })),
    },
    todayEvents,
    weekendEvents,
    openRestaurants,
    headlines,
  };
}
