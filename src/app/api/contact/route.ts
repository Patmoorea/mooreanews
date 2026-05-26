import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { ENV } from "@/lib/constants";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

const Payload = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  subject: z.string().optional().default(""),
  message: z.string().min(5).max(2000),
});

type Data = z.infer<typeof Payload>;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  let parsed: Data;
  try {
    const body = await req.json();
    parsed = Payload.parse(body);
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_payload" },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const tasks: Promise<unknown>[] = [
    sendTelegramNotification(buildTelegramMessage(parsed)),
  ];

  if (ENV.resendKey) {
    const resend = new Resend(ENV.resendKey);
    tasks.push(
      resend.emails
        .send({
          from: ENV.resendFrom,
          to: [ENV.resendAdmin],
          replyTo: parsed.email,
          subject: `[Moorea Hub] Contact : ${parsed.subject || "(sans sujet)"}`,
          html: buildAdminHtml(parsed),
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
