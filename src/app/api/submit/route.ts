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
  type: z.string().min(1),
  district: z.string().optional().default(""),
  title: z.string().min(2).max(160),
  description: z.string().min(5).max(2000),
  date: z.string().optional().default(""),
  time: z.string().optional().default(""),
  location: z.string().optional().default(""),
  name: z.string().min(2).max(100),
  contact: z.string().min(3).max(120),
  consent: z.union([z.literal("on"), z.boolean()]).optional(),
});

type SubmitData = z.infer<typeof Payload>;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  let parsed: SubmitData;
  try {
    const body = await req.json();
    parsed = Payload.parse(body);
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "invalid_payload", detail: String(err) },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const normalizedType = normalizeSubmissionType(parsed.type);
  const warnings: string[] = [];
  let delivered = false;

  const telegramMessage = buildTelegramMessage(parsed);
  const telegram = await sendTelegramNotification(telegramMessage);
  if (telegram.ok) delivered = true;
  else warnings.push(telegram.error ?? "Telegram: échec d'envoi");

  // Persiste en base si Supabase est configuré
  const supabase = getAdminSupabase();
  if (supabase) {
    const { error } = await supabase.from("submissions").insert({
      type: normalizedType,
      district: parsed.district || null,
      title: parsed.title,
      description: parsed.description,
      date: parsed.date || null,
      start_time: parsed.time || null,
      location: parsed.location || null,
      user_name: parsed.name,
      user_email: parsed.contact.includes("@")
        ? parsed.contact
        : `${parsed.contact}@unknown`,
      user_phone: parsed.contact.includes("@") ? null : parsed.contact,
    });
    if (error) warnings.push(`Supabase: ${error.message}`);
  }

  if (ENV.resendKey) {
    const resend = new Resend(ENV.resendKey);
    const result = await resend.emails
      .send({
        from: ENV.resendFrom,
        to: [ENV.resendAdmin],
        subject: `[MooreaNews] Nouvelle soumission : ${parsed.title}`,
        html: buildAdminHtml(parsed),
        text: buildAdminText(parsed),
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

function normalizeSubmissionType(
  input: string
): "event" | "annonce" | "service" | "signalement" | "suggestion" {
  // Compatibilité : anciennes valeurs côté UI
  const legacyMap: Record<string, string | undefined> = {
    evenement: "event",
    info: "suggestion",
    autre: "suggestion",
  };

  const mapped = legacyMap[input] ?? input;

  return (
    (["event", "annonce", "service", "signalement", "suggestion"] as const).find(
      (t) => t === mapped
    ) ?? "suggestion"
  );
}

function buildTelegramMessage(d: SubmitData): string {
  const labelByType: Record<
    ReturnType<typeof normalizeSubmissionType>,
    string
  > = {
    event: "Événement",
    annonce: "Annonce",
    service: "Service",
    signalement: "Signalement",
    suggestion: "Suggestion / info",
  };

  const typeLabel = labelByType[normalizeSubmissionType(d.type)];
  const lines = [
    `<b>📢 Nouvelle soumission — ${escapeHtml(typeLabel)}</b>`,
    "",
    `<b>${escapeHtml(d.title)}</b>`,
    escapeHtml(d.description),
    "",
  ];
  if (d.date || d.time)
    lines.push(`📅 ${escapeHtml(d.date)} ${escapeHtml(d.time)}`);
  if (d.location) lines.push(`📍 ${escapeHtml(d.location)}`);
  if (d.district) lines.push(`🏝 District : ${escapeHtml(d.district)}`);
  lines.push("");
  lines.push(`👤 ${escapeHtml(d.name)}`);
  lines.push(`📞 ${escapeHtml(d.contact)}`);
  return lines.join("\n");
}

function buildAdminHtml(d: SubmitData): string {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color:#0c4a6e">📢 Nouvelle soumission MooreaNews</h1>
      <p><strong>Type :</strong> ${escapeHtml(d.type)}</p>
      <p><strong>Titre :</strong> ${escapeHtml(d.title)}</p>
      <p><strong>Description :</strong><br>${escapeHtml(d.description).replace(/\n/g, "<br>")}</p>
      ${d.date ? `<p><strong>Date :</strong> ${escapeHtml(d.date)} ${escapeHtml(d.time)}</p>` : ""}
      ${d.location ? `<p><strong>Lieu :</strong> ${escapeHtml(d.location)}</p>` : ""}
      ${d.district ? `<p><strong>District :</strong> ${escapeHtml(d.district)}</p>` : ""}
      <hr>
      <p><strong>Auteur :</strong> ${escapeHtml(d.name)}</p>
      <p><strong>Contact :</strong> ${escapeHtml(d.contact)}</p>
    </div>
  `;
}

function buildAdminText(d: SubmitData): string {
  return [
    "Nouvelle soumission MooreaNews",
    "",
    `Type : ${d.type}`,
    `Titre : ${d.title}`,
    `Description : ${d.description}`,
    d.date && `Date : ${d.date} ${d.time}`,
    d.location && `Lieu : ${d.location}`,
    d.district && `District : ${d.district}`,
    "",
    `Auteur : ${d.name}`,
    `Contact : ${d.contact}`,
  ]
    .filter(Boolean)
    .join("\n");
}
