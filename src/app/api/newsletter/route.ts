import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { ENV } from "@/lib/constants";
import {
  escapeHtml,
  sendTelegramNotification,
} from "@/lib/telegram";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Payload = z.object({
  email: z.email(),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  let email: string;
  try {
    const body = await req.json();
    email = Payload.parse(body).email;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const warnings: string[] = [];
  let delivered = false;

  const telegram = await sendTelegramNotification(
    `📧 <b>Nouvelle inscription newsletter</b>\n${escapeHtml(email)}`
  );
  if (telegram.ok) delivered = true;
  else warnings.push(telegram.error ?? "Telegram: échec d'envoi");

  const supabase = getAdminSupabase();
  if (supabase) {
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email,
        confirmed: true,
        source: "site",
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    if (error) warnings.push(`Supabase: ${error.message}`);
  }

  if (ENV.resendKey) {
    const resend = new Resend(ENV.resendKey);
    const result = await resend.emails
      .send({
        from: ENV.resendFrom,
        to: [email],
        subject: "Bienvenue sur MooreaNews ! 🌺",
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h1 style="color:#0c4a6e;font-family:Marcellus,serif">Ia ora na, ${escapeHtml(email)} !</h1>
            <p>Merci de votre inscription à la newsletter de <strong>MooreaNews</strong>.</p>
            <p>Vous recevrez chaque <strong>dimanche à 18h</strong> le récap de la semaine à venir (événements, alertes, actus) et le brief matinal au fil de l'actualité sur mooreanews.com.</p>
            <p style="color:#075985">À très vite,<br>L'équipe MooreaNews</p>
          </div>
        `,
        text: `Merci de votre inscription à MooreaNews ! Chaque dimanche à 18h : récap de la semaine à venir. mooreanews.com`,
      })
      .then(() => ({ ok: true as const }))
      .catch((err) => ({ ok: false as const, error: String(err) }));

    if (result.ok) delivered = true;
    else warnings.push(result.error ?? "Resend: échec d'envoi");
  } else {
    warnings.push("Resend non configuré");
  }

  if (!delivered && !supabase) {
    return NextResponse.json(
      { ok: false, error: "not_configured", warnings },
      { status: 503, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true, warnings }, { status: 200, headers: CORS_HEADERS });
}
