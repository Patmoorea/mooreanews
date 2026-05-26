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

  const tasks: Promise<unknown>[] = [
    sendTelegramNotification(
      `📧 <b>Nouvelle inscription newsletter</b>\n${escapeHtml(email)}`
    ),
  ];

  const supabase = getAdminSupabase();
  if (supabase) {
    tasks.push(
      Promise.resolve(
        supabase.from("newsletter_subscribers").upsert(
          {
            email,
            confirmed: true,
            source: "site",
            confirmed_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        )
      ).then(() => null)
    );
  }

  if (ENV.resendKey) {
    const resend = new Resend(ENV.resendKey);
    tasks.push(
      resend.emails
        .send({
          from: ENV.resendFrom,
          to: [email],
          subject: "Bienvenue sur Moorea Hub ! 🌺",
          html: `
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h1 style="color:#0c4a6e;font-family:Marcellus,serif">Ia ora na, ${escapeHtml(email)} !</h1>
              <p>Merci de votre inscription à la newsletter de <strong>Moorea Hub</strong>.</p>
              <p>Vous recevrez chaque semaine un récap des actus, événements et bons plans de l'île, directement dans votre boîte mail.</p>
              <p style="color:#075985">À très vite,<br>L'équipe Moorea Hub</p>
            </div>
          `,
          text: `Merci de votre inscription à Moorea Hub ! Vous recevrez chaque semaine un récap des actus de l'île.`,
        })
        .catch(() => null)
    );
  }

  await Promise.all(tasks);

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: CORS_HEADERS }
  );
}
