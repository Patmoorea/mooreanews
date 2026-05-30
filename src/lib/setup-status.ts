/**
 * Vérification de la configuration production (admin).
 */

import { ENV, SITE } from "@/lib/constants";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  getPushSubscriberCounts,
  getVapidPublicKey,
} from "@/lib/push-notify";

export type SetupCheck = {
  id: string;
  label: string;
  ok: boolean;
  /** Ne compte pas dans le score « requis » (ex. marées payantes). */
  optional?: boolean;
  detail: string;
  action?: string;
};

export async function getProductionSetupStatus(): Promise<SetupCheck[]> {
  const checks: SetupCheck[] = [];
  const pushCounts = await getPushSubscriberCounts();

  checks.push({
    id: "supabase",
    label: "Supabase",
    ok: Boolean(ENV.supabaseUrl && ENV.supabaseServiceRoleKey),
    detail: ENV.supabaseUrl ? "URL + service role configurés" : "Variables Supabase manquantes sur Vercel",
    action: "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY",
  });

  checks.push({
    id: "resend",
    label: "Emails (Resend)",
    ok: Boolean(ENV.resendKey),
    detail: ENV.resendKey ? `Expéditeur : ${ENV.resendFrom}` : "RESEND_API_KEY manquante",
    action: "RESEND_API_KEY, RESEND_FROM",
  });

  checks.push({
    id: "vapid",
    label: "Push Web (VAPID)",
    ok: Boolean(
      getVapidPublicKey() &&
        process.env.VAPID_PRIVATE_KEY?.trim() &&
        pushCounts.tableOk,
    ),
    detail: (() => {
      if (!getVapidPublicKey()) {
        return "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquantes";
      }
      const counts = pushCounts;
      if (!counts.tableOk) {
        return "Clés VAPID OK — table push_subscriptions absente (SQL)";
      }
      return `Clés OK · ${counts.push} abonné(s) push · ${counts.email} email alertes`;
    })(),
    action: "npx web-push generate-vapid-keys → Vercel + prod-setup-all.sql",
  });

  checks.push({
    id: "cron",
    label: "Crons sécurisés",
    ok: Boolean(process.env.CRON_SECRET?.trim()),
    detail: process.env.CRON_SECRET
      ? "CRON_SECRET défini — job unique /api/cron/daily (~6h Tahiti)"
      : "Recommandé en production (Vercel Cron Hobby = 1×/jour)",
    action: "CRON_SECRET",
  });

  checks.push({
    id: "stripe",
    label: "Stripe (monétisation)",
    ok: Boolean(
      process.env.STRIPE_SECRET_KEY?.trim() &&
        process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
    ),
    detail:
      process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
        ? "Stripe configuré (boost annonces + premium restaurant)"
        : "Clés Stripe incomplètes — paiements désactivés",
    action:
      "STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY + webhook checkout.session.completed",
  });

  checks.push({
    id: "tides",
    label: "Marées WorldTides (optionnel)",
    ok: true,
    optional: true,
    detail: process.env.WORLD_TIDES_API_KEY?.trim()
      ? "Clé API active — marées précises SHOM/WorldTides"
      : "Ignoré — marées calculées localement (gratuit, sans API payante)",
  });

  const admin = getAdminSupabase();
  if (admin) {
    const tables = [
      { name: "page_views", label: "Stats visites" },
      { name: "push_subscriptions", label: "Push alertes" },
      { name: "alert_email_subscriptions", label: "Email alertes quartier" },
      { name: "commerce_payments", label: "Paiements Stripe" },
    ] as const;

    for (const t of tables) {
      const { error } = await admin.from(t.name).select("id").limit(1);
      checks.push({
        id: `table_${t.name}`,
        label: `Table ${t.label}`,
        ok: !error,
        detail: error
          ? `Table absente : exécutez supabase/prod-setup-all.sql puis page-analytics-v2.sql si stats`
          : "OK",
        action:
          t.name === "page_views"
            ? "Supabase → prod-setup-all.sql + page-analytics-v2.sql"
            : "Supabase → SQL Editor → prod-setup-all.sql",
      });
    }

    const { error: latErr } = await admin
      .from("info_pratiques")
      .select("lat")
      .limit(1);
    checks.push({
      id: "info_lat",
      label: "GPS infos pratiques",
      ok: !latErr,
      detail: latErr
        ? "Colonnes lat/lon absentes"
        : "Colonnes GPS disponibles",
      action: "supabase/info-pratiques-coords.sql",
    });
  }

  checks.push({
    id: "site",
    label: "URL site",
    ok: SITE.url.startsWith("https://"),
    detail: SITE.url,
  });

  return checks;
}
