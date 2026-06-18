import crypto from "crypto";

// ─── Telegram WebApp Init Data Parser ────────────────────────────────────────

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface TelegramWebAppData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
  query_id?: string;
}

export function parseTelegramInitData(initData: string): TelegramWebAppData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return null;

    urlParams.delete("hash");

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(process.env.TELEGRAM_BOT_TOKEN ?? "")
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (calculatedHash !== hash) return null;

    const userStr = urlParams.get("user");
    const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : undefined;

    return {
      user,
      auth_date: parseInt(urlParams.get("auth_date") ?? "0"),
      hash,
      query_id: urlParams.get("query_id") ?? undefined,
    };
  } catch {
    return null;
  }
}

// ─── Telegram Login Widget Verification ──────────────────────────────────────

export function verifyTelegramLogin(data: Record<string, string>): boolean {
  const { hash, ...fields } = data;
  if (!hash) return false;

  const dataCheckString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");

  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.TELEGRAM_BOT_TOKEN ?? "")
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const authDate = parseInt(fields.auth_date ?? "0");
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now - authDate > 86400; // 24 hours

  return calculatedHash === hash && !isExpired;
}

// ─── Telegram Bot API ─────────────────────────────────────────────────────────

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown" | "MarkdownV2";
    replyMarkup?: object;
  }
) {
  const response = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode ?? "HTML",
      reply_markup: options?.replyMarkup,
    }),
  });
  return response.json();
}

export async function sendKhatmCompletedNotification(
  telegramId: string,
  khatmTitle: string
) {
  const text = `🎉 <b>Xatm yakunlandi!</b>

📖 <b>${khatmTitle}</b> xatmi muvaffaqiyatli yakunlandi!

Barcha ishtirokchilarga savob bo'lsin! 🤲
Yana bir xatmga qo'shilish uchun: /start`;

  return sendTelegramMessage(telegramId, text);
}

export async function sendJuzDeadlineReminder(
  telegramId: string,
  juzNumber: number,
  khatmTitle: string,
  hoursLeft: number
) {
  const text = `⏰ <b>Pora muddati yaqinlashmoqda!</b>

📚 Xatm: <b>${khatmTitle}</b>
📄 Pora: <b>${juzNumber}-pora</b>
⏳ Qolgan vaqt: <b>${hoursLeft} soat</b>

O'qib bo'lsangiz, tasdiqlashni unutmang!`;

  return sendTelegramMessage(telegramId, text);
}

export async function broadcastMessage(
  telegramIds: string[],
  text: string
) {
  const results = await Promise.allSettled(
    telegramIds.map((id) => sendTelegramMessage(id, text))
  );
  return results;
}
