import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayUTC, COIN_RULES, daysBetween } from "@/lib/utils";
import { addCoins } from "@/lib/coins";

// GET /api/users/me — profile + daily coin check
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const userId = session.user.id;
    const today  = todayUTC();

    // ── Kunlik +5 coin tekshirish ──────────────────────────────
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: {
        id:          true,
        lastDailyAt: true,
        streakDays:  true,
        coins:       true,
        level:       true,
      },
    });

    if (user) {
      const lastDaily = user.lastDailyAt;
      const isNewDay  = !lastDaily || daysBetween(new Date(lastDaily), today) >= 1;

      if (isNewDay) {
        // Streak hisoblash
        const wasYesterday = lastDaily && daysBetween(new Date(lastDaily), today) === 1;
        const newStreak    = wasYesterday ? (user.streakDays ?? 0) + 1 : 1;

        await prisma.$transaction(async (tx) => {
          // +5 kunlik coin
          await addCoins(tx, userId, COIN_RULES.DAILY_ACTIVITY, "DAILY_ACTIVITY",
            "Kunlik faollik bonusi ☀️");

          // DailyActivity
          await tx.dailyActivity.upsert({
            where:  { userId_date: { userId, date: today } },
            create: { userId, date: today, pagesRead: 0, juzRead: 0, coinsEarned: COIN_RULES.DAILY_ACTIVITY },
            update: { coinsEarned: { increment: COIN_RULES.DAILY_ACTIVITY } },
          });

          // Streak va lastDailyAt yangilash
          await tx.user.update({
            where: { id: userId },
            data:  {
              lastDailyAt:  today,
              streakDays:   newStreak,
              lastActiveAt: new Date(),
            },
          });

          // Streak bonuslari
          if (newStreak === 7) {
            await addCoins(tx, userId, COIN_RULES.STREAK_7, "STREAK_7",
              "7 kunlik streak bonusi! 🔥");
          }
          if (newStreak === 30) {
            await addCoins(tx, userId, COIN_RULES.STREAK_30, "STREAK_30",
              "30 kunlik streak bonusi! 💎");
          }
        });
      }
    }

    // ── To'liq profil ma'lumotlari ─────────────────────────────
    const fullUser = await prisma.user.findUnique({
      where:   { id: userId },
      include: {
        badges:       { include: { badge: true } },
        coinHistory:  { orderBy: { createdAt: "desc" }, take: 5 },
        _count: {
          select: { participations: true, juzAssigned: true },
        },
      },
    });

    const todayActivity = await prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    return NextResponse.json({ user: fullUser, todayActivity });
  } catch (err) {
    console.error("[GET /api/users/me]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// PATCH /api/users/me — profile yangilash
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const { country, isIncognito } = await req.json();

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data:  {
        ...(country !== undefined && { country }),
        ...(typeof isIncognito === "boolean" && { isIncognito }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

// DELETE /api/users/me — foydalanuvchi o'z hisobini o'chiradi
export async function DELETE() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const userId = session.user.id;

    await prisma.$transaction(async (tx) => {
      // Foydalanuvchi yaratgan xatmlar (Khatm.createdBy cascade emas) —
      // ularni o'chiramiz, bu juz/participations/joinRequests ni cascade qiladi
      await tx.khatm.deleteMany({ where: { createdById: userId } });

      // Foydalanuvchining o'zi — qolgan barcha bog'liq yozuvlar onDelete: Cascade orqali ketadi
      // (accounts, sessions, participations, juzProgress, dailyActivities,
      //  joinRequests, notifications, coinHistory, badges). Juz.assignedTo esa null bo'ladi.
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("[DELETE /api/users/me]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
