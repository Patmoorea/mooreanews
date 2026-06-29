import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { ENV } from "@/lib/constants";
import { checkPublicFormSpam } from "@/lib/spam-guard";
import { FORM_CORS_HEADERS, spamBlockedResponse } from "@/lib/spam-api-response";
import { escapeHtml } from "@/lib/telegram";
import { getAdminSupabase } from "@/lib/supabase/admin";

const Payload = z.object({
  email: z.email(),
});

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: FORM_CORS_HEADERS });
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400, headers: FORM_CORS_HEADERS }
    );
  }

  const spam = await checkPublicFormSpam(req, "newsletter", raw, {
    email: typeof raw.email === "string" ? raw.email : undefined,
  });
  if (!spam.allowed) return spamBlockedResponse(spam);

  let email: string;
  try {
    email = Payload.parse(raw).email;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_email" },
      { status: 400, headers: FORM_CORS_HEADERS }
    );
  }

  const warnings: string[] = [];
  let delivered = false;

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
    else delivered = true;
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

  if (!delivered) {
    return NextResponse.json(
      { ok: false, error: "not_configured", warnings },
      { status: 503, headers: FORM_CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true, warnings }, { status: 200, headers: FORM_CORS_HEADERS });
}
