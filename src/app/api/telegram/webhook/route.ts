import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

// POST /api/telegram/webhook — Telegram Bot webhook
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // Handle /start command
    if (update.message?.text?.startsWith("/start")) {
      const chatId = update.message.chat.id;
      const from = update.message.from;

      // Register or update user (baza xatosi bo'lsa ham xabar yuborilaverishi uchun try/catch)
      try {
        await prisma.user.upsert({
          where: { telegramId: String(chatId) },
          create: {
            telegramId: String(chatId),
            firstName: from.first_name,
            lastName: from.last_name,
            username: from.username,
          },
          update: {
            firstName: from.first_name,
            lastName: from.last_name,
            username: from.username,
            lastActiveAt: new Date(),
          },
        });
      } catch (e) {
        console.error("[/start upsert]", e);
      }

      // App URL: env to'g'ri (https) bo'lsa o'shani, aks holda so'rov kelgan domenni ishlatamiz
      const envUrl = process.env.NEXT_PUBLIC_APP_URL;
      const appUrl =
        envUrl && envUrl.startsWith("https://")
          ? envUrl.replace(/\/$/, "")
          : req.nextUrl.origin;
      const webAppUrl = `${appUrl}/telegram`;

      await sendTelegramMessage(chatId, `
🕌 <b>BuloqKhatm</b> — Global Qur'on Xatmi Platformasi

بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

Assalomu alaykum! BuloqKhatm — bu <b>jamoaviy Qur'on xatmi</b> platformasi. Qur'onning 30 porasi ishtirokchilar o'rtasida taqsimlanadi va birgalikda xatm qilinadi.

✨ <b>Imkoniyatlar:</b>
📖 Pora olish, o'qib tasdiqlash
👥 Jamoaviy yoki shaxsiy (taklif kodi bilan) xatm yaratish
🪙 Har o'qilgan pora uchun Ajr Ball
🔥 Kunlik streak va medallar
🏆 Reyting jadvalida o'z o'rningiz

Xatm yakunlangach barcha ishtirokchilarga xabar beriladi.

Boshlash uchun quyidagi tugmani bosing 👇`, {
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [[
            {
              text: "📖 Web App'ni ochish",
              web_app: { url: webAppUrl },
            },
          ]],
        },
      });
    }

    // Handle /my_juz command
    if (update.message?.text === "/my_juz") {
      const chatId = update.message.chat.id;
      const user = await prisma.user.findUnique({
        where: { telegramId: String(chatId) },
      });

      if (!user) {
        await sendTelegramMessage(chatId, "Ro'yxatdan o'tmagansiz. /start bosing.");
        return NextResponse.json({ ok: true });
      }

      const activeJuz = await prisma.juz.findMany({
        where: { assignedToId: user.id, status: "RESERVED" },
        include: { khatm: { select: { title: true } } },
      });

      if (activeJuz.length === 0) {
        await sendTelegramMessage(chatId, "📖 Hozirda faol porangiz yo'q.\n\nPlatformaga kirib pora oling!");
      } else {
        const list = activeJuz
          .map((j) => `📄 ${j.juzNumber}-pora — ${j.khatm.title}`)
          .join("\n");
        await sendTelegramMessage(chatId, `📖 <b>Faol poralaringiz:</b>\n\n${list}`, {
          parseMode: "HTML",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Telegram Webhook]", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
