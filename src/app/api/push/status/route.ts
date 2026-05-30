import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getVapidPublicKey, isPushAvailable } from "@/lib/push-notify";

export const dynamic = "force-dynamic";

/** Diagnostic public push (sans données sensibles). */
export async function GET() {
  const vapid = isPushAvailable();
  const publicKey = getVapidPublicKey();

  let tableOk = false;
  let subscribers = 0;
  let emailSubscribers = 0;

  const admin = getAdminSupabase();
  if (admin) {
    const { error: pushErr, count: pushCount } = await admin
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    tableOk = !pushErr;
    subscribers = pushCount ?? 0;

    const { count: emailCount } = await admin
      .from("alert_email_subscriptions")
      .select("id", { count: "exact", head: true });
    emailSubscribers = emailCount ?? 0;
  }

  return NextResponse.json({
    ok: vapid && tableOk,
    vapidConfigured: vapid,
    publicKeyPreview: publicKey ? `${publicKey.slice(0, 12)}…` : null,
    tableReady: tableOk,
    pushSubscribers: subscribers,
    emailSubscribers,
    subscribeUrl: "/alertes",
    hint: !vapid
      ? "Ajoutez VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY sur Vercel puis redeploy."
      : !tableOk
        ? "Exécutez supabase/prod-setup-all.sql (table push_subscriptions)."
        : "Prêt — activez les notifications sur /alertes.",
  });
}
