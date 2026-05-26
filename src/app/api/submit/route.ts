import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { sendTelegramNotification, escapeHtml } from "@/lib/telegram";

export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const SubmitSchema = z.object({
  type: z.enum(["event", "announcement", "restaurant", "activity"]),
  title: z.string().min(3).max(150),
  description: z.string().min(10).max(2000),
  date: z.string().optional(),
  location: z.string().min(2).max(200),
  category: z.string().max(60).optional(),
  contactName: z.string().min(2).max(100),
  contactPhone: z.string().max(30).optional(),
  contactEmail: z.string().email().max(150),
  consent: z.boolean().refine((v) => v === true),
});

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = SubmitSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", issues: parsed.error.flatten() },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    const data = parsed.data;

    const html = buildEmailHtml(data);
    const text = buildEmailText(data);
    const telegramMsg = buildTelegramMessage(data);

    const tasks: Promise<unknown>[] = [];

    const resendKey = process.env.RESEND_API_KEY;
    const to = process.env.SUBMIT_NOTIFY_EMAIL ?? "contact@mooreanews.com";
    const from = process.env.SUBMIT_FROM_EMAIL ?? "no-reply@mooreanews.com";
    if (resendKey) {
      const resend = new Resend(resendKey);
      tasks.push(
        resend.emails.send({
          from,
          to,
          replyTo: data.contactEmail,
          subject: `Moorea Hub — Nouvelle soumission (${data.type}) : ${data.title}`,
          html,
          text,
        })
      );
    }

    tasks.push(sendTelegramNotification(telegramMsg));

    await Promise.allSettled(tasks);

    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erreur" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

type SubmitData = z.infer<typeof SubmitSchema>;

function buildEmailHtml(d: SubmitData) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#fefcf8;">
      <div style="background:linear-gradient(135deg,#06b6d4,#0c4a6e);color:white;padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="margin:0;font-size:22px;">Nouvelle soumission Moorea Hub</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:13px;">Type : ${d.type} · ${new Date().toLocaleString("fr-FR")}</p>
      </div>
      <div style="background:white;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e0f2fe;border-top:none;">
        <h2 style="margin:0 0 12px;color:#0c4a6e;">${escapeHtml(d.title)}</h2>
        <p style="color:#4b5563;line-height:1.6;">${escapeHtml(d.description)}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
          <tr><td style="padding:6px 0;color:#6b7280;width:120px;">Lieu</td><td style="color:#0c4a6e;font-weight:600;">${escapeHtml(d.location)}</td></tr>
          ${d.date ? `<tr><td style="padding:6px 0;color:#6b7280;">Date</td><td style="color:#0c4a6e;font-weight:600;">${escapeHtml(d.date)}</td></tr>` : ""}
          ${d.category ? `<tr><td style="padding:6px 0;color:#6b7280;">Catégorie</td><td style="color:#0c4a6e;font-weight:600;">${escapeHtml(d.category)}</td></tr>` : ""}
          <tr><td colspan="2" style="padding-top:16px;border-top:1px solid #e0f2fe;color:#0c4a6e;font-weight:700;">Contact</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Nom</td><td style="color:#0c4a6e;font-weight:600;">${escapeHtml(d.contactName)}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td><a href="mailto:${escapeHtml(d.contactEmail)}" style="color:#06b6d4;">${escapeHtml(d.contactEmail)}</a></td></tr>
          ${d.contactPhone ? `<tr><td style="padding:6px 0;color:#6b7280;">Téléphone</td><td><a href="tel:${escapeHtml(d.contactPhone)}" style="color:#06b6d4;">${escapeHtml(d.contactPhone)}</a></td></tr>` : ""}
        </table>
      </div>
    </div>
  `;
}

function buildEmailText(d: SubmitData) {
  return `MOOREA HUB - Nouvelle soumission

Type : ${d.type}
Titre : ${d.title}

${d.description}

Lieu : ${d.location}
${d.date ? `Date : ${d.date}\n` : ""}${d.category ? `Catégorie : ${d.category}\n` : ""}

Contact :
${d.contactName}
${d.contactEmail}
${d.contactPhone ?? ""}
`;
}

function buildTelegramMessage(d: SubmitData) {
  return `<b>🌺 Moorea Hub — Nouvelle soumission</b>

<b>Type :</b> ${escapeHtml(d.type)}
<b>Titre :</b> ${escapeHtml(d.title)}
<b>Lieu :</b> ${escapeHtml(d.location)}
${d.date ? `<b>Date :</b> ${escapeHtml(d.date)}\n` : ""}${d.category ? `<b>Catégorie :</b> ${escapeHtml(d.category)}\n` : ""}

<i>${escapeHtml(d.description.slice(0, 400))}${d.description.length > 400 ? "…" : ""}</i>

<b>Contact :</b> ${escapeHtml(d.contactName)}
✉️ ${escapeHtml(d.contactEmail)}
${d.contactPhone ? `📞 ${escapeHtml(d.contactPhone)}` : ""}`;
}
