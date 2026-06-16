import { NextResponse } from "next/server";
import {
  checkFacebookTokenHealth,
  ensureFacebookTokensInProcess,
} from "@/lib/facebook-token";

export const dynamic = "force-dynamic";

async function authorized(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Diagnostic jetons Meta (protégé par CRON_SECRET).
 * GET /api/watch/facebook-health?secret=...
 */
export async function GET(req: Request) {
  if (!(await authorized(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ensured = await ensureFacebookTokensInProcess();
  const health = await checkFacebookTokenHealth();

  return NextResponse.json({
    ok: health.userTokenValid || health.pageTokenValid,
    refreshedInMemory: ensured.userRefreshed,
    pageResolvedFromUser: ensured.pageResolvedFromUser,
    hint: !health.pageTokenValid
      ? "Jeton page inaccessible — FACEBOOK_USER_ACCESS_TOKEN long + admin page MooreaNews requis (FACEBOOK_PAGE_ACCESS_TOKEN optionnel, renouvelé auto)."
      : ensured.pageResolvedFromUser
        ? "Jeton page régénéré automatiquement depuis le jeton utilisateur — plus besoin de le mettre à jour sur Vercel."
        : health.daysUntilUserExpiry != null && health.daysUntilUserExpiry < 14
          ? `Jeton utilisateur expire dans ~${health.daysUntilUserExpiry} j — renouveler une fois (APP_ID + APP_SECRET)`
          : "Jetons OK — jeton page renouvelé automatiquement à chaque cron.",
    health,
    env: {
      appId: Boolean(process.env.FACEBOOK_APP_ID?.trim()),
      appSecret: Boolean(process.env.FACEBOOK_APP_SECRET?.trim()),
    },
  });
}
