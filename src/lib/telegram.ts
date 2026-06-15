/**
 * Notification Telegram pour les soumissions modérables (annonces, événements, newsletter).
 */

import { ENV } from "@/lib/constants";
import { getAdminBotToken } from "@/lib/telegram-config";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendTelegramNotification(
  htmlMessage: string
): Promise<{ ok: boolean; error?: string }> {
  if (!ENV.telegramBotToken || !ENV.telegramChatId) {
    return { ok: false, error: "Telegram non configuré" };
  }
  const token = getAdminBotToken() || ENV.telegramBotToken;
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: ENV.telegramChatId,
        text: htmlMessage,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
