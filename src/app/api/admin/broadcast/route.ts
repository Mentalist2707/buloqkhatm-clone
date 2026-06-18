import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { broadcastMessage } from "@/lib/telegram";

// POST /api/admin/broadcast — send message to all users with Telegram
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 });
    }

    const { message, title } = await req.json();
    if (!message) {
      return NextResponse.json({ error: "Xabar matnini kiriting" }, { status: 400 });
    }

    // Get all users with Telegram ID
    const users = await prisma.user.findMany({
      where: { isBanned: false },
      select: { id: true, telegramId: true },
    });

    const telegramIds = users
      .map((u) => u.telegramId)
      .filter(Boolean) as string[];

    const text = title ? `<b>${title}</b>\n\n${message}` : message;

    // Create in-app notifications
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: "SYSTEM" as const,
        title: title ?? "Yangi xabar",
        message,
      })),
    });

    // Send Telegram messages (if bot token configured)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      await broadcastMessage(telegramIds, text);
    }

    return NextResponse.json({ sent: users.length });
  } catch (err) {
    console.error("[POST /api/admin/broadcast]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
