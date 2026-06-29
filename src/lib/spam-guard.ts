/**
 * Anti-spam formulaires publics (contact, newsletter, soumissions…).
 */

import { getAdminSupabase } from "@/lib/supabase/admin";

const HONEYPOT_FIELDS = ["website", "company", "_gotcha", "url"] as const;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "yopmail.com",
  "throwaway.email",
  "10minutemail.com",
  "trashmail.com",
  "getnada.com",
  "sharklasers.com",
]);

const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|forex|crypto pump|betting)\b/i,
  /\b(seo service|backlinks|guest post)\b/i,
  /(https?:\/\/){3,}/i,
  /\b\w+@\w+\.\w+.*\b\w+@\w+\.\w+/i,
];

export type SpamScope =
  | "contact"
  | "newsletter"
  | "submit"
  | "signalement";

export type SpamVerdict =
  | { allowed: true }
  /** Bot piégé — répondre ok sans notifier */
  | { allowed: false; silent: true; reason: string }
  /** Vrai refus */
  | { allowed: false; silent: false; reason: string; status: 429 | 400 };

const RATE_LIMITS: Record<SpamScope, { max: number; windowMs: number }> = {
  contact: { max: 5, windowMs: 60 * 60 * 1000 },
  newsletter: { max: 8, windowMs: 60 * 60 * 1000 },
  submit: { max: 4, windowMs: 60 * 60 * 1000 },
  signalement: { max: 6, windowMs: 60 * 60 * 1000 },
};

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export function honeypotTriggered(body: Record<string, unknown>): boolean {
  for (const field of HONEYPOT_FIELDS) {
    const v = body[field];
    if (typeof v === "string" && v.trim().length > 0) return true;
  }
  return false;
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? DISPOSABLE_DOMAINS.has(domain) : false;
}

export function looksLikeSpamText(...parts: (string | undefined)[]): boolean {
  const text = parts.filter(Boolean).join(" ");
  if (text.length < 3) return false;
  const urlCount = (text.match(/https?:\/\//gi) ?? []).length;
  if (urlCount >= 4) return true;
  return SPAM_PATTERNS.some((re) => re.test(text));
}

async function checkRateLimit(
  ip: string,
  scope: SpamScope,
): Promise<boolean> {
  const { max, windowMs } = RATE_LIMITS[scope];
  const admin = getAdminSupabase();
  if (!admin) return true;

  const key = `${scope}:${ip}`;
  const now = Date.now();
  const resetAt = new Date(now + windowMs).toISOString();

  const { data: row } = await admin
    .from("form_rate_limits")
    .select("hits, reset_at")
    .eq("id", key)
    .maybeSingle();

  if (!row) {
    await admin.from("form_rate_limits").upsert({
      id: key,
      hits: 1,
      reset_at: resetAt,
    });
    return true;
  }

  const expired = new Date(row.reset_at).getTime() <= now;
  if (expired) {
    await admin.from("form_rate_limits").upsert({
      id: key,
      hits: 1,
      reset_at: resetAt,
    });
    return true;
  }

  if (row.hits >= max) return false;

  await admin
    .from("form_rate_limits")
    .update({ hits: row.hits + 1 })
    .eq("id", key);

  return true;
}

export async function checkPublicFormSpam(
  req: Request,
  scope: SpamScope,
  body: Record<string, unknown>,
  texts: { email?: string; fields?: string[] } = {},
): Promise<SpamVerdict> {
  if (honeypotTriggered(body)) {
    return { allowed: false, silent: true, reason: "honeypot" };
  }

  const ip = getClientIp(req);
  const withinLimit = await checkRateLimit(ip, scope).catch(() => true);
  if (!withinLimit) {
    return {
      allowed: false,
      silent: false,
      reason: "rate_limit",
      status: 429,
    };
  }

  if (texts.email && isDisposableEmail(texts.email)) {
    return { allowed: false, silent: true, reason: "disposable_email" };
  }

  const blob = texts.fields?.join(" ") ?? "";
  if (looksLikeSpamText(blob)) {
    return { allowed: false, silent: true, reason: "spam_content" };
  }

  return { allowed: true };
}

/** Champ honeypot à mettre dans les formulaires (caché). */
export const HONEYPOT_FIELD_NAME = "website";
