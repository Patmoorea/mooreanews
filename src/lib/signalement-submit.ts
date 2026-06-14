/**
 * Création centralisée d’un signalement citoyen (web, Telegram…).
 */

import { Resend } from "resend";
import { ENV } from "@/lib/constants";
import {
  getSignalementCategory,
  signalementCategoryRequiresPhoto,
  type SignalementCategoryId,
} from "@/lib/signalement-categories";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { escapeHtml, sendTelegramNotification } from "@/lib/telegram";

export type SignalementInput = {
  categoryId: SignalementCategoryId | string;
  description: string;
  district?: string;
  location?: string;
  name?: string;
  contact: string;
  coverUrl?: string | null;
  sourceChannel?: "web" | "telegram" | "whatsapp";
  telegramChatId?: string;
  telegramUsername?: string;
};

export type SignalementResult = {
  ok: boolean;
  error?: string;
  submissionId?: string;
  warnings: string[];
};

function buildDescription(input: SignalementInput): string {
  const cat = getSignalementCategory(input.categoryId);
  const channel =
    input.sourceChannel === "telegram"
      ? ` [Telegram${input.telegramUsername ? ` @${input.telegramUsername}` : ""}]`
      : input.sourceChannel === "whatsapp"
        ? " [WhatsApp]"
        : "";
  return `[${cat.label}]${channel}\n${input.description.trim()}`;
}

function buildTelegramAdminMessage(input: SignalementInput): string {
  const cat = getSignalementCategory(input.categoryId);
  const lines = [
    `<b>📢 Signalement citoyen — ${escapeHtml(cat.label)}</b>`,
    input.sourceChannel === "telegram" ? `<i>via Telegram</i>` : "",
    "",
    escapeHtml(input.description.trim()),
    "",
  ].filter(Boolean);
  if (input.location) lines.push(`📍 ${escapeHtml(input.location)}`);
  if (input.district) lines.push(`🏝 ${escapeHtml(input.district)}`);
  if (input.coverUrl?.trim()) {
    lines.push(`🖼 <a href="${escapeHtml(input.coverUrl.trim())}">Photo</a>`);
  }
  lines.push("");
  lines.push(`👤 ${escapeHtml(input.name?.trim() || "Anonyme")}`);
  lines.push(`📞 ${escapeHtml(input.contact)}`);
  lines.push("");
  lines.push(`→ <a href="https://www.mooreanews.com/admin/submissions">Modérer</a>`);
  return lines.join("\n");
}

function buildAdminHtml(input: SignalementInput): string {
  const cat = getSignalementCategory(input.categoryId);
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px;">
      <h1 style="color:#0c4a6e">Signalement — ${escapeHtml(cat.label)}</h1>
      <p>${escapeHtml(input.description).replace(/\n/g, "<br>")}</p>
      ${input.location ? `<p><strong>Lieu :</strong> ${escapeHtml(input.location)}</p>` : ""}
      ${input.district ? `<p><strong>Quartier :</strong> ${escapeHtml(input.district)}</p>` : ""}
      ${
        input.coverUrl?.trim()
          ? `<p><img src="${escapeHtml(input.coverUrl.trim())}" alt="Photo" style="max-width:100%;max-height:400px;border-radius:8px" /></p>`
          : ""
      }
      <p><strong>Canal :</strong> ${escapeHtml(input.sourceChannel ?? "web")}</p>
      <p><strong>Contact :</strong> ${escapeHtml(input.contact)}</p>
    </div>
  `;
}

export async function createSignalementSubmission(
  input: SignalementInput,
): Promise<SignalementResult> {
  const warnings: string[] = [];
  const cat = getSignalementCategory(input.categoryId);

  if (!input.description.trim() || input.description.trim().length < 5) {
    return { ok: false, error: "description_too_short", warnings };
  }

  if (
    signalementCategoryRequiresPhoto(input.categoryId) &&
    !input.coverUrl?.trim()
  ) {
    return { ok: false, error: "missing_photo", warnings };
  }

  if (!input.contact.trim() || input.contact.trim().length < 3) {
    return { ok: false, error: "missing_contact", warnings };
  }

  const payload = {
    type: "signalement" as const,
    title: cat.title,
    description: buildDescription(input),
    district: input.district?.trim() || null,
    location: input.location?.trim() || null,
    cover_url: input.coverUrl?.trim() || null,
    user_name: input.name?.trim() || "Anonyme",
    user_email: input.contact.includes("@")
      ? input.contact.trim()
      : `${input.contact.trim()}@signalement.local`,
    user_phone: input.contact.includes("@") ? null : input.contact.trim(),
    signalement_category: cat.id,
    source_channel: input.sourceChannel ?? "web",
  };

  let delivered = false;
  let submissionId: string | undefined;

  const telegram = await sendTelegramNotification(
    buildTelegramAdminMessage(input),
  );
  if (telegram.ok) delivered = true;
  else warnings.push(telegram.error ?? "Telegram admin: échec");

  const supabase = getAdminSupabase();
  if (supabase) {
    const baseRow = {
      type: payload.type,
      district: payload.district,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      cover_url: payload.cover_url,
      user_name: payload.user_name,
      user_email: payload.user_email,
      user_phone: payload.user_phone,
    };

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        ...baseRow,
        signalement_category: payload.signalement_category,
        source_channel: payload.source_channel,
      })
      .select("id")
      .single();

    if (error?.message?.includes("signalement_category")) {
      const fallback = await supabase
        .from("submissions")
        .insert(baseRow)
        .select("id")
        .single();
      if (fallback.error) warnings.push(`Supabase: ${fallback.error.message}`);
      else {
        submissionId = fallback.data?.id;
        delivered = true;
      }
    } else if (error) {
      warnings.push(`Supabase: ${error.message}`);
    } else {
      submissionId = data?.id;
      delivered = true;
    }
  }

  if (ENV.resendKey) {
    const resend = new Resend(ENV.resendKey);
    const result = await resend.emails
      .send({
        from: ENV.resendFrom,
        to: [ENV.resendAdmin],
        subject: `[MooreaNews] Signalement : ${cat.label}`,
        html: buildAdminHtml(input),
      })
      .then(() => ({ ok: true as const }))
      .catch((err) => ({ ok: false as const, error: String(err) }));
    if (result.ok) delivered = true;
    else warnings.push(result.error ?? "Resend: échec");
  }

  if (!delivered) {
    return { ok: false, error: "not_delivered", warnings };
  }

  return { ok: true, submissionId, warnings };
}
