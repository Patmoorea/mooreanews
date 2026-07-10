#!/usr/bin/env node
/** Revalide le cache Vercel via le cron garde (wait=1). */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const secret = process.env.CRON_SECRET?.trim();
if (!secret) {
  console.error("CRON_SECRET manquant");
  process.exit(1);
}

const url = `https://www.mooreanews.com/api/cron/garde-weekend?secret=${encodeURIComponent(secret)}&force=1&wait=1`;
const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
const body = await res.text();
console.log("HTTP", res.status);
console.log(body.slice(0, 1500));
