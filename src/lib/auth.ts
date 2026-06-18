import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import crypto from "crypto";

// ─── Telegram Login Widget data verification ──────────────────────────────────
// https://core.telegram.org/widgets/login#checking-authorization

function verifyTelegramWidgetData(data: Record<string, string>): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return false;

  const { hash, ...fields } = data;
  if (!hash) return false;

  // auth_date tekshirish — 24 soatdan eski bo'lmasin
  const authDate = parseInt(fields.auth_date ?? "0");
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) return false;

  // data-check-string yasash
  const checkString = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join("\n");

  // secret = SHA256(bot_token)
  const secretKey = crypto
    .createHash("sha256")
    .update(botToken)
    .digest();

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  return expectedHash === hash;
}

// ─── Telegram WebApp initData verification ────────────────────────────────────
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

function verifyTelegramInitData(initData: string): Record<string, string> | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;
  if (!initData) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    if (!hash) return null;

    urlParams.delete("hash");

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const expectedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (expectedHash !== hash) return null;

    // Parse qilingan fieldlarni qaytarish
    const result: Record<string, string> = {};
    urlParams.forEach((v, k) => { result[k] = v; });
    result.hash = hash;
    return result;
  } catch {
    return null;
  }
}

// ─── User upsert — topish yoki yaratish ──────────────────────────────────────

async function upsertTelegramUser(telegramData: {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}) {
  const telegramId = String(telegramData.id);
  const firstName  = telegramData.first_name  ?? null;
  const lastName   = telegramData.last_name   ?? null;
  const username   = telegramData.username    ?? null;
  const photoUrl   = telegramData.photo_url   ?? null;
  const fullName   = [firstName, lastName].filter(Boolean).join(" ") || `User${telegramId}`;

  const user = await prisma.user.upsert({
    where:  { telegramId },
    create: {
      telegramId,
      firstName,
      lastName,
      username,
      photoUrl,
      name:  fullName,
      image: photoUrl,
      role:  "USER",
    },
    update: {
      firstName,
      lastName,
      username,
      photoUrl,
      name:         fullName,
      image:        photoUrl,
      lastActiveAt: new Date(),
    },
  });

  return user;
}

// ─── NextAuth config ──────────────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [

    // ── 1. Telegram Login Widget (web browser) ────────────────────
    CredentialsProvider({
      id:   "telegram-widget",
      name: "Telegram",
      credentials: {
        id:         { label: "Telegram ID",  type: "text" },
        first_name: { label: "First Name",   type: "text" },
        last_name:  { label: "Last Name",    type: "text" },
        username:   { label: "Username",     type: "text" },
        photo_url:  { label: "Photo URL",    type: "text" },
        auth_date:  { label: "Auth Date",    type: "text" },
        hash:       { label: "Hash",         type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.id || !credentials?.hash) return null;

          // Telegram signature tekshirish
          const isDev   = process.env.NODE_ENV === "development";
          const devHash = String(credentials.hash) === "dev_bypass_hash";

          // Dev mode da bypass, production da strict verify
          if (!isDev || !devHash) {
            const valid = verifyTelegramWidgetData({
              id:         String(credentials.id),
              first_name: String(credentials.first_name ?? ""),
              last_name:  String(credentials.last_name  ?? ""),
              username:   String(credentials.username   ?? ""),
              photo_url:  String(credentials.photo_url  ?? ""),
              auth_date:  String(credentials.auth_date  ?? ""),
              hash:       String(credentials.hash),
            });

            if (!valid && process.env.NODE_ENV === "production") {
              console.error("[Telegram Widget] Invalid signature");
              return null;
            }
          }
          const user = await upsertTelegramUser({
            id:         String(credentials.id),
            first_name: String(credentials.first_name ?? ""),
            last_name:  String(credentials.last_name  ?? ""),
            username:   String(credentials.username   ?? ""),
            photo_url:  String(credentials.photo_url  ?? ""),
          });

          return {
            id:    user.id,
            name:  user.name,
            email: `${user.telegramId}@telegram.buloqkhatm`,
            image: user.photoUrl ?? user.image,
          };
        } catch (err) {
          console.error("[Telegram Widget authorize]", err);
          return null;
        }
      },
    }),

    // ── 2. Telegram Mini App (initData) ──────────────────────────
    CredentialsProvider({
      id:   "telegram-miniapp",
      name: "Telegram Mini App",
      credentials: {
        initData: { label: "Init Data", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.initData) return null;

          const initData = String(credentials.initData);

          // initData ni verify qilish
          const parsed = verifyTelegramInitData(initData);

          // Development da skip
          if (!parsed && process.env.NODE_ENV === "production") {
            console.error("[Telegram MiniApp] Invalid initData");
            return null;
          }

          // user ma'lumotlarini olish
          let telegramUser: any;
          if (parsed?.user) {
            try {
              telegramUser = JSON.parse(decodeURIComponent(parsed.user));
            } catch { /* ignore */ }
          }

          // Development da fallback
          if (!telegramUser && process.env.NODE_ENV === "development") {
            const params = new URLSearchParams(initData);
            const userStr = params.get("user");
            if (userStr) {
              try { telegramUser = JSON.parse(decodeURIComponent(userStr)); } catch { /* ignore */ }
            }
          }

          if (!telegramUser?.id) return null;

          const user = await upsertTelegramUser({
            id:         String(telegramUser.id),
            first_name: telegramUser.first_name,
            last_name:  telegramUser.last_name,
            username:   telegramUser.username,
            photo_url:  telegramUser.photo_url,
          });

          return {
            id:    user.id,
            name:  user.name,
            email: `${user.telegramId}@telegram.buloqkhatm`,
            image: user.photoUrl ?? user.image,
          };
        } catch (err) {
          console.error("[Telegram MiniApp authorize]", err);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
      }

      if (user || trigger === "update") {
        const userId = (token.id as string) ?? user?.id;
        if (userId) {
          try {
            const dbUser = await prisma.user.findUnique({
              where:  { id: userId },
              select: {
                telegramId: true,
                role:       true,
                level:      true,
                coins:      true,
                firstName:  true,
                lastName:   true,
                name:       true,
                image:      true,
                photoUrl:   true,
                streakDays: true,
              },
            });

            if (dbUser) {
              token.telegramId = dbUser.telegramId;
              token.role       = dbUser.role;
              token.level      = dbUser.level;
              token.coins      = (dbUser as any).coins ?? 0;
              token.streakDays = dbUser.streakDays;
              token.name       =
                [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") ||
                dbUser.name || token.name;
              token.picture    = dbUser.photoUrl ?? dbUser.image ?? token.picture;
            }
          } catch (err) {
            // coins ustuni hali migration qilinmagan bo'lsa
            try {
              const dbUser = await prisma.user.findUnique({
                where:  { id: userId },
                select: {
                  telegramId: true, role: true, level: true,
                  firstName: true, lastName: true, name: true,
                  image: true, photoUrl: true, streakDays: true,
                },
              });
              if (dbUser) {
                token.telegramId = dbUser.telegramId;
                token.role       = dbUser.role;
                token.level      = dbUser.level;
                token.coins      = 0;
                token.streakDays = dbUser.streakDays;
                token.name       =
                  [dbUser.firstName, dbUser.lastName].filter(Boolean).join(" ") ||
                  dbUser.name || token.name;
                token.picture    = dbUser.photoUrl ?? dbUser.image ?? token.picture;
              }
            } catch { /* silent */ }
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id         = token.id         as string;
        session.user.role       = (token.role       as Role)   ?? "USER";
        session.user.coins      = (token.coins      as number)  ?? 0;
        session.user.level      = (token.level      as string)  ?? "Beginner";
        session.user.telegramId = (token.telegramId as string)  ?? "";
        session.user.streakDays = (token.streakDays as number)  ?? 0;
        if (token.name)    session.user.name  = token.name    as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
});
