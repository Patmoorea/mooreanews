#!/usr/bin/env node
/**
 * Seed MooreaNews Supabase database from /data/*.json
 *
 * Usage :
 *   1. Configurer .env.local avec NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 *   2. Exécuter le schema SQL via Supabase SQL Editor (supabase/schema.sql)
 *   3. node scripts/seed.mjs
 *
 * Le script :
 * - Vide les tables de contenu (sauf profiles, submissions, newsletter)
 * - Importe les JSON depuis /data/*.json
 * - Affiche un récapitulatif des insertions
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

// Charge .env.local manuellement (sans dotenv pour rester léger)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"\n]+)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  console.warn("⚠️  Aucun .env.local trouvé, utilisation des env système.");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "❌  NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const DATA = path.join(__dirname, "..", "data");
const articles = JSON.parse(readFileSync(path.join(DATA, "articles.json"), "utf8"));
const events = JSON.parse(readFileSync(path.join(DATA, "events.json"), "utf8"));
const announcements = JSON.parse(
  readFileSync(path.join(DATA, "announcements.json"), "utf8")
);
const restaurants = JSON.parse(
  readFileSync(path.join(DATA, "restaurants.json"), "utf8")
);
const activities = JSON.parse(
  readFileSync(path.join(DATA, "activities.json"), "utf8")
);
const infos = JSON.parse(
  readFileSync(path.join(DATA, "info-pratiques.json"), "utf8")
);

async function clear(table) {
  const { error } = await supabase
    .from(table)
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(`Cleaning ${table}: ${error.message}`);
}

async function insert(table, rows) {
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`Inserting in ${table}: ${error.message}`);
}

console.log("🌺  Seed MooreaNews démarré...\n");

const TABLES = ["articles", "events", "announcements", "restaurants", "activities", "info_pratiques"];
for (const t of TABLES) {
  await clear(t);
  console.log(`  🧹  ${t} vidée`);
}

// Articles
await insert(
  "articles",
  articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.body,
    category: a.category,
    tags: a.tags ?? [],
    cover_url: a.image ?? null,
    author: a.author ?? null,
    featured: Boolean(a.featured),
    published: true,
    published_at: a.publishedAt,
  }))
);
console.log(`  ✅  ${articles.length} articles`);

// Events
await insert(
  "events",
  events.map((e) => ({
    title: e.title,
    description: e.description,
    category: e.category,
    date: e.date,
    end_date: e.endDate ?? null,
    start_time: e.time ?? null,
    location: e.location,
    district: e.district ?? null,
    organizer: e.organizer ?? null,
    price: e.price ?? null,
    contact: e.contact ?? null,
    url: e.url ?? null,
    cover_url: e.image ?? null,
    published: true,
  }))
);
console.log(`  ✅  ${events.length} événements`);

// Announcements
await insert(
  "announcements",
  announcements.map((a) => ({
    title: a.title,
    body: a.body,
    category: a.type ?? "general",
    district: a.district ?? null,
    price: a.price ?? null,
    contact: a.contact ?? null,
    author: null,
    cover_url: a.image ?? null,
    published: true,
  }))
);
console.log(`  ✅  ${announcements.length} annonces`);

// Restaurants
await insert(
  "restaurants",
  restaurants.map((r) => ({
    name: r.name,
    description: r.description,
    cuisine: r.cuisine,
    district: r.district,
    address: r.address,
    phone: r.phone ?? null,
    hours: r.openingHours ?? null,
    price_range: r.priceLevel ? "€".repeat(r.priceLevel) : null,
    lat: r.lat ?? null,
    lon: r.lon ?? null,
    cover_url: r.image ?? null,
    url: r.website ?? null,
    published: true,
    featured: Boolean(r.premium),
  }))
);
console.log(`  ✅  ${restaurants.length} restaurants`);

// Activities
await insert(
  "activities",
  activities.map((a) => ({
    name: a.name,
    description: a.description,
    category: a.category,
    district: a.district ?? null,
    address: null,
    phone: a.contact ?? null,
    price: a.price ?? null,
    duration: a.duration ?? null,
    cover_url: a.image ?? null,
    url: a.website ?? null,
    published: true,
    featured: false,
  }))
);
console.log(`  ✅  ${activities.length} activités`);

// Infos pratiques
await insert(
  "info_pratiques",
  infos.map((i, idx) => ({
    title: i.title,
    description: i.description,
    category: i.category,
    address: i.address ?? null,
    phone: i.phone ?? null,
    hours: i.hours ?? null,
    emergency: i.category === "urgence",
    url: i.website ?? null,
    published: true,
    display_order: idx,
  }))
);
console.log(`  ✅  ${infos.length} infos pratiques`);

console.log("\n🌺  Seed terminé avec succès !");
