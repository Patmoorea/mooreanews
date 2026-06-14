/**
 * API Telegram Bot (envoi, fichiers, webhook).
 */

import { ENV } from "@/lib/constants";

const API_BASE = () =>
  `https://api.telegram.org/bot${ENV.telegramBotToken}`;

export type TelegramInlineButton = {
  text: string;
  callback_data: string;
};

export async function telegramApi<T = unknown>(
  method: string,
  body?: Record<string, unknown>,
): Promise<{ ok: boolean; result?: T; error?: string }> {
  if (!ENV.telegramBotToken) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN manquant" };
  }
  try {
    const res = await fetch(`${API_BASE()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json()) as {
      ok?: boolean;
      result?: T;
      description?: string;
    };
    if (!res.ok || !json.ok) {
      return { ok: false, error: json.description ?? res.statusText };
    }
    return { ok: true, result: json.result };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function sendTelegramChatMessage(
  chatId: number | string,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown";
    replyMarkup?: {
      inline_keyboard?: TelegramInlineButton[][];
      keyboard?: { text: string }[][];
      resize_keyboard?: boolean;
      one_time_keyboard?: boolean;
      remove_keyboard?: boolean;
    };
  },
): Promise<{ ok: boolean; error?: string }> {
  const r = await telegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options?.parseMode ?? "HTML",
    disable_web_page_preview: true,
    reply_markup: options?.replyMarkup,
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
): Promise<void> {
  await telegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function getTelegramFilePath(
  fileId: string,
): Promise<string | null> {
  const r = await telegramApi<{ file_path: string }>("getFile", {
    file_id: fileId,
  });
  return r.result?.file_path ?? null;
}

export async function downloadTelegramFile(
  fileId: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const path = await getTelegramFilePath(fileId);
  if (!path || !ENV.telegramBotToken) return null;
  const res = await fetch(
    `https://api.telegram.org/file/bot${ENV.telegramBotToken}/${path}`,
  );
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = path.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : ext === "gif"
          ? "image/gif"
          : "image/jpeg";
  return { buffer, contentType };
}

export async function setTelegramWebhook(
  webhookUrl: string,
  secretToken?: string,
): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  };
  if (secretToken?.trim()) {
    body.secret_token = secretToken.trim();
  }
  const r = await telegramApi("setWebhook", body);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function getTelegramWebhookInfo(): Promise<{
  ok: boolean;
  url?: string;
  error?: string;
}> {
  const r = await telegramApi<{ url?: string }>("getWebhookInfo");
  return r.ok
    ? { ok: true, url: r.result?.url }
    : { ok: false, error: r.error };
}
