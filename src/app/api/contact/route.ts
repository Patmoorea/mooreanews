import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { ENV } from "@/lib/constants";
import { checkPublicFormSpam } from "@/lib/spam-guard";
import { FORM_CORS_HEADERS, spamBlockedResponse } from "@/lib/spam-api-response";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

const Payload = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  subject: z.string().optional().default(""),
  message: z.string().min(5).max(2000),
});

type Data = z.infer<typeof Payload>;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: FORM_CORS_HEADERS });
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: FORM_CORS_HEADERS }
    );
  }

  const spam = await checkPublicFormSpam(req, "contact", raw, {
    email: typeof raw.email === "string" ? raw.email : undefined,
    fields: [
      typeof raw.message === "string" ? raw.message : "",
      typeof raw.subject === "string" ? raw.subject : "",
      typeof raw.name === "string" ? raw.name : "",
    ],
  });
  if (!spam.allowed) return spamBlockedResponse(spam);

  let parsed: Data;
  try {
    parsed = Payload.parse(raw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: FORM_CORS_HEADERS }
    );
  }

  const warnings: string[] = [];
  let delivered = false;

  const telegram = await sendTelegramNotification(buildTelegramMessage(parsed));
  if (telegram.ok) delivered = true;
  else warnings.push(telegram.error ?? "Telegram: échec d'envoi");

  if (ENV.resendKey) {
    const resend = new Resend(ENV.resendKey);
    const result = await resend.emails
      .send({
        from: ENV.resendFrom,
        to: [ENV.resendAdmin],
        replyTo: parsed.email,
        subject: `[MooreaNews] Contact : ${parsed.subject || "(sans sujet)"}`,
        html: buildAdminHtml(parsed),
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
      { ok: false, error: "not_delivered", warnings },
      { status: 503, headers: FORM_CORS_HEADERS }
    );
  }

  return NextResponse.json({ ok: true, warnings }, { status: 200, headers: FORM_CORS_HEADERS });
}

function buildTelegramMessage(d: Data): string {
  return [
    `<b>✉️ Nouveau message contact</b>`,
    "",
    `<b>${escapeHtml(d.name)}</b> &lt;${escapeHtml(d.email)}&gt;`,
    d.subject ? `<i>Sujet : ${escapeHtml(d.subject)}</i>` : "",
    "",
    escapeHtml(d.message),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAdminHtml(d: Data): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#0c4a6e">✉️ Nouveau message via le site</h1>
      <p><strong>De :</strong> ${escapeHtml(d.name)} (${escapeHtml(d.email)})</p>
      ${d.subject ? `<p><strong>Sujet :</strong> ${escapeHtml(d.subject)}</p>` : ""}
      <hr>
      <p style="white-space:pre-wrap">${escapeHtml(d.message)}</p>
    </div>
  `;
}
