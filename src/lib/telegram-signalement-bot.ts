/**
 * Bot Telegram — signalements citoyens (menu + photo + géolocalisation).
 */

import {
  SIGNALEMENT_CATEGORIES,
  getSignalementCategory,
  signalementCategoryRequiresPhoto,
  type SignalementCategoryId,
} from "@/lib/signalement-categories";
import type { SignalementInput } from "@/lib/signalement-submit";
import { createSignalementSubmission } from "@/lib/signalement-submit";
import { uploadBufferToMedia } from "@/lib/media-upload";
import { getAdminSupabase } from "@/lib/supabase/admin";
import {
  answerCallbackQuery,
  downloadTelegramFile,
  sendTelegramChatMessage,
  type TelegramInlineButton,
} from "@/lib/telegram-api";
import { MOOREA_DISTRICTS } from "@/lib/constants";

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

type TelegramMessage = {
  message_id: number;
  chat: { id: number; type: string; username?: string; first_name?: string };
  text?: string;
  photo?: { file_id: string; width: number; height: number }[];
  location?: { latitude: number; longitude: number };
  contact?: { phone_number?: string };
};

type TelegramCallbackQuery = {
  id: string;
  from: { id: number; username?: string; first_name?: string };
  message?: { chat: { id: number }; message_id: number };
  data?: string;
};

type SessionRow = {
  chat_id: string;
  step: string;
  category_id: string | null;
  description: string | null;
  location: string | null;
  district: string | null;
  cover_url: string | null;
  photo_file_id: string | null;
  contact: string | null;
  updated_at: string;
};

const STEP = {
  IDLE: "idle",
  AWAIT_DESC: "await_desc",
  AWAIT_LOCATION: "await_location",
  AWAIT_DISTRICT: "await_district",
  AWAIT_PHOTO: "await_photo",
  AWAIT_CONTACT: "await_contact",
} as const;

function categoryKeyboard(): TelegramInlineButton[][] {
  const rows: TelegramInlineButton[][] = [];
  let row: TelegramInlineButton[] = [];
  for (const cat of SIGNALEMENT_CATEGORIES) {
    row.push({
      text: `${cat.emoji} ${cat.label}`,
      callback_data: `cat:${cat.id}`,
    });
    if (row.length === 2) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  rows.push([{ text: "❌ Annuler", callback_data: "cat:cancel" }]);
  return rows;
}

function districtKeyboard(): { text: string }[][] {
  const districts = [...MOOREA_DISTRICTS, "Toute l'île"];
  const rows: { text: string }[][] = [];
  for (let i = 0; i < districts.length; i += 2) {
    rows.push(districts.slice(i, i + 2).map((d) => ({ text: d })));
  }
  return rows;
}

async function getSession(chatId: string): Promise<SessionRow | null> {
  const supabase = getAdminSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("telegram_signalement_sessions")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle();
  return (data as SessionRow | null) ?? null;
}

async function upsertSession(
  chatId: string,
  patch: Partial<Omit<SessionRow, "chat_id" | "updated_at">>,
): Promise<void> {
  const supabase = getAdminSupabase();
  if (!supabase) return;
  await supabase.from("telegram_signalement_sessions").upsert(
    {
      chat_id: chatId,
      updated_at: new Date().toISOString(),
      ...patch,
    },
    { onConflict: "chat_id" },
  );
}

async function clearSession(chatId: string): Promise<void> {
  const supabase = getAdminSupabase();
  if (!supabase) return;
  await supabase
    .from("telegram_signalement_sessions")
    .delete()
    .eq("chat_id", chatId);
}

async function sendWelcome(chatId: number | string): Promise<void> {
  await sendTelegramChatMessage(
    chatId,
    [
      "<b>🌺 MooreaNews — Signalement citoyen</b>",
      "",
      "Signalez une info locale : accident, route, baleines, incendie, météo…",
      "",
      "Choisissez une catégorie ci-dessous.",
      "",
      "<i>Modération humaine avant publication. Urgence vitale : appelez le 15.</i>",
    ].join("\n"),
    { replyMarkup: { inline_keyboard: categoryKeyboard() } },
  );
  await upsertSession(String(chatId), { step: STEP.IDLE, category_id: null });
}

async function finalizeSubmission(
  chatId: number,
  session: SessionRow,
  username?: string,
): Promise<{ submissionId?: string; input?: SignalementInput }> {
  const cat = getSignalementCategory(session.category_id ?? "autre");
  const contact =
    session.contact?.trim() ||
    (username ? `@${username}` : `telegram:${chatId}`);

  const input: SignalementInput = {
    categoryId: (session.category_id ?? "autre") as SignalementCategoryId,
    description: session.description ?? "",
    district: session.district ?? "Toute l'île",
    location: session.location ?? undefined,
    name: username ? `@${username}` : "Citoyen Telegram",
    contact,
    coverUrl: session.cover_url,
    sourceChannel: "telegram",
    telegramChatId: String(chatId),
    telegramUsername: username,
  };

  const result = await createSignalementSubmission(input);

  if (!result.ok) {
    await sendTelegramChatMessage(
      chatId,
      `❌ Envoi impossible (${result.error ?? "erreur"}). Réessayez /start`,
    );
    return {};
  }

  await clearSession(String(chatId));
  await sendTelegramChatMessage(
    chatId,
    [
      "✅ <b>Signalement reçu</b>",
      "",
      `Catégorie : ${cat.emoji} ${cat.label}`,
      "",
      "L'équipe MooreaNews vérifie sous 24 h. Si validé, une alerte pourra être publiée.",
      "",
      "Merci pour votre contribution 🌺",
    ].join("\n"),
    {
      replyMarkup: {
        remove_keyboard: true,
      },
    },
  );

  return {
    submissionId: result.submissionId,
    input,
  };
}

async function handlePhoto(
  chatId: number,
  session: SessionRow,
  fileId: string,
  username?: string,
): Promise<void> {
  const admin = getAdminSupabase();
  if (!admin) {
    await sendTelegramChatMessage(chatId, "❌ Stockage indisponible.");
    return;
  }

  const file = await downloadTelegramFile(fileId);
  if (!file) {
    await sendTelegramChatMessage(chatId, "❌ Photo illisible. Réessayez.");
    return;
  }

  const ext =
    file.contentType === "image/png"
      ? "png"
      : file.contentType === "image/webp"
        ? "webp"
        : "jpg";
  const path = `submissions/tg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const uploaded = await uploadBufferToMedia(
    admin,
    file.buffer,
    path,
    file.contentType as "image/png" | "image/jpeg" | "image/webp",
  );

  if (!uploaded.ok) {
    await sendTelegramChatMessage(chatId, "❌ Échec upload photo.");
    return;
  }

  const updated: SessionRow = {
    ...session,
    cover_url: uploaded.url,
    photo_file_id: fileId,
    step: STEP.AWAIT_CONTACT,
  };
  await upsertSession(String(chatId), {
    cover_url: uploaded.url,
    photo_file_id: fileId,
    step: STEP.AWAIT_CONTACT,
  });
  await sendTelegramChatMessage(
    chatId,
    "📞 Dernier pas : envoyez votre email ou numéro (ou tapez <code>skip</code> pour rester anonyme).",
  );
  void updated;
  void username;
}

export async function handleTelegramSignalementUpdate(
  update: TelegramUpdate,
): Promise<{
  ok: boolean;
  handled: boolean;
  aiEnrich?: { submissionId: string; input: SignalementInput };
}> {
  if (update.callback_query) {
    const cq = update.callback_query;
    const chatId = cq.message?.chat.id;
    if (!chatId) return { ok: true, handled: false };

    await answerCallbackQuery(cq.id);

    if (cq.data === "cat:cancel") {
      await clearSession(String(chatId));
      await sendTelegramChatMessage(chatId, "Annulé. /start pour recommencer.");
      return { ok: true, handled: true };
    }

    if (cq.data?.startsWith("cat:")) {
      const catId = cq.data.slice(4) as SignalementCategoryId;
      const cat = getSignalementCategory(catId);
      await upsertSession(String(chatId), {
        step: STEP.AWAIT_DESC,
        category_id: catId,
        description: null,
        location: null,
        district: null,
        cover_url: null,
      });
      await sendTelegramChatMessage(
        chatId,
        `${cat.emoji} <b>${cat.label}</b>\n\nDécrivez la situation (lieu, heure, détails factuels) :`,
      );
      return { ok: true, handled: true };
    }
    return { ok: true, handled: true };
  }

  const msg = update.message;
  if (!msg?.chat?.id) return { ok: true, handled: false };

  const chatId = msg.chat.id;
  const text = msg.text?.trim() ?? "";
  const username = msg.chat.username ?? msg.chat.first_name;

  if (text === "/start" || text === "/signalement" || text === "/aide") {
    await sendWelcome(chatId);
    return { ok: true, handled: true };
  }

  let session = await getSession(String(chatId));

  if (!session || session.step === STEP.IDLE) {
    if (text.startsWith("/")) {
      await sendWelcome(chatId);
      return { ok: true, handled: true };
    }
    await sendWelcome(chatId);
    return { ok: true, handled: true };
  }

  if (msg.location) {
    const loc = `${msg.location.latitude.toFixed(5)}, ${msg.location.longitude.toFixed(5)}`;
    await upsertSession(String(chatId), {
      location: loc,
      step: STEP.AWAIT_DISTRICT,
    });
    await sendTelegramChatMessage(chatId, "🏝 Choisissez votre quartier :", {
      replyMarkup: {
        keyboard: districtKeyboard(),
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return { ok: true, handled: true };
  }

  if (msg.photo?.length && session.step === STEP.AWAIT_PHOTO) {
    const largest = msg.photo[msg.photo.length - 1];
    await handlePhoto(chatId, session, largest.file_id, username);
    return { ok: true, handled: true };
  }

  if (session.step === STEP.AWAIT_DESC && text.length >= 5) {
    await upsertSession(String(chatId), {
      description: text,
      step: STEP.AWAIT_LOCATION,
    });
    await sendTelegramChatMessage(
      chatId,
      "📍 Indiquez le lieu (texte) ou partagez votre position Telegram.\n\nTapez <code>skip</code> pour passer.",
    );
    return { ok: true, handled: true };
  }

  if (session.step === STEP.AWAIT_LOCATION) {
    const location = text.toLowerCase() === "skip" ? null : text;
    await upsertSession(String(chatId), {
      location,
      step: STEP.AWAIT_DISTRICT,
    });
    await sendTelegramChatMessage(chatId, "🏝 Choisissez votre quartier :", {
      replyMarkup: {
        keyboard: districtKeyboard(),
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
    return { ok: true, handled: true };
  }

  if (session.step === STEP.AWAIT_DISTRICT) {
    const district = MOOREA_DISTRICTS.includes(text as (typeof MOOREA_DISTRICTS)[number])
      ? text
      : text === "Toute l'île"
        ? text
        : "Toute l'île";
    session = { ...session, district };
    await upsertSession(String(chatId), { district, step: STEP.AWAIT_PHOTO });

    if (signalementCategoryRequiresPhoto(session.category_id ?? "")) {
      await sendTelegramChatMessage(
        chatId,
        "📷 Envoyez une <b>photo</b> (obligatoire pour cette catégorie).",
        { replyMarkup: { remove_keyboard: true } },
      );
      return { ok: true, handled: true };
    }

    await upsertSession(String(chatId), { step: STEP.AWAIT_CONTACT });
    await sendTelegramChatMessage(
      chatId,
      "📷 Photo optionnelle — envoyez une image ou tapez <code>skip</code>.",
      { replyMarkup: { remove_keyboard: true } },
    );
    return { ok: true, handled: true };
  }

  if (session.step === STEP.AWAIT_PHOTO) {
    if (text.toLowerCase() === "skip") {
      if (signalementCategoryRequiresPhoto(session.category_id ?? "")) {
        await sendTelegramChatMessage(chatId, "⚠️ Photo obligatoire pour cette catégorie.");
        return { ok: true, handled: true };
      }
      await upsertSession(String(chatId), { step: STEP.AWAIT_CONTACT });
      await sendTelegramChatMessage(
        chatId,
        "📞 Email ou numéro de contact (ou <code>skip</code> pour anonyme) :",
      );
      return { ok: true, handled: true };
    }
    await sendTelegramChatMessage(chatId, "Envoyez une photo ou tapez skip.");
    return { ok: true, handled: true };
  }

  if (session.step === STEP.AWAIT_CONTACT) {
    const contact =
      text.toLowerCase() === "skip" ? `telegram:${chatId}` : text;
    session = { ...session, contact };
    await upsertSession(String(chatId), { contact });
    const finalized = await finalizeSubmission(chatId, session, username);
    if (finalized.submissionId && finalized.input) {
      return {
        ok: true,
        handled: true,
        aiEnrich: {
          submissionId: finalized.submissionId,
          input: finalized.input,
        },
      };
    }
    return { ok: true, handled: true };
  }

  await sendTelegramChatMessage(chatId, "Tapez /start pour un nouveau signalement.");
  return { ok: true, handled: true };
}
