/**
 * Bots Telegram MooreaNews :
 * - Admin (TELEGRAM_BOT_TOKEN) → alertes veille / modération → TELEGRAM_CHAT_ID
 * - Public (@MooreanewsPublic_bot) → signalements citoyens + posts canal public
 */

export function getAdminBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
}

/** Token du bot public — obligatoire pour signalements / webhook (pas de fallback admin). */
export function getPublicBotTokenStrict(): string {
  return process.env.TELEGRAM_PUBLIC_BOT_TOKEN?.trim() ?? "";
}

/** Token du bot public citoyens (fallback admin : legacy, éviter pour webhook). */
export function getPublicBotToken(): string {
  return getPublicBotTokenStrict() || getAdminBotToken();
}

export function getPublicBotUsername(): string {
  const raw =
    process.env.TELEGRAM_PUBLIC_BOT_USERNAME?.trim() || "MooreanewsPublic_bot";
  return raw.replace(/^@/, "");
}

export function getPublicBotUrl(): string {
  return `https://t.me/${getPublicBotUsername()}`;
}

/** Canal / groupe public pour articles et digest (ID -100…). */
export function getPublicChatId(): string {
  return process.env.TELEGRAM_PUBLIC_CHAT_ID?.trim() ?? "";
}

export function getPublicChannelUsername(): string | undefined {
  const raw = process.env.TELEGRAM_PUBLIC_CHANNEL_USERNAME?.trim();
  if (!raw) return undefined;
  return raw.replace(/^@/, "");
}

export function getPublicChannelUrl(): string | undefined {
  const u = getPublicChannelUsername();
  return u ? `https://t.me/${u}` : undefined;
}
