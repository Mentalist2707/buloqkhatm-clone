import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { COIN_RULES, JUZ_TOTAL_PAGES, todayUTC } from "@/lib/utils";
import {
  addCoins,
  checkAndAwardDailyActivity,
  awardJuzCompleted,
  checkAndAwardBadges,
} from "@/lib/coins";
import { z } from "zod";

const schema = z.object({
  pagesRead: z.number().int().min(1).max(20),
});

/**
 * POST /api/juz/[id]/progress
 *
 * Body: { pagesRead: number }  — Bugun o'qilgan umumiy sahifalar soni (1-20)
 *
 * Logika:
 * 1. JuzProgress upsert — pagesRead yangilanadi
 * 2. Agar pagesRead >= totalPages → juz COMPLETED, +25 BuloqCoin
 * 3. DailyActivity: pagesRead++ , kunlik +5 coin (1 marta)
 * 4. Badge tekshirish
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "pagesRead 1–20 oralig'ida bo'lishi kerak" },
        { status: 400 }
      );
    }

    const { pagesRead } = parsed.data;
    const userId = session.user.id;

    // Juz va tegishli khatm
    const juz = await prisma.juz.findUnique({
      where: { id: rp.id },
      include: { khatm: { select: { id: true, title: true, status: true } } },
    });

    if (!juz) {
      return NextResponse.json({ error: "Pora topilmadi" }, { status: 404 });
    }
    if (juz.assignedToId !== userId) {
      return NextResponse.json({ error: "Bu sizning porangiz emas" }, { status: 403 });
    }
    if (juz.status === "COMPLETED") {
      return NextResponse.json({ error: "Pora allaqachon yakunlangan" }, { status: 400 });
    }
    if (juz.khatm.status !== "ACTIVE") {
      return NextResponse.json({ error: "Xatm faol emas" }, { status: 400 });
    }

    const totalPages = juz.totalPages ?? JUZ_TOTAL_PAGES;
    const isCompleting = pagesRead >= totalPages;

    const result = await prisma.$transaction(async (tx) => {
      const today = todayUTC();

      // ─── 1. JuzProgress upsert ───────────────────────────────────
      const progress = await tx.juzProgress.upsert({
        where:  { juzId: juz.id },
        create: {
          juzId:      juz.id,
          userId,
          pagesRead:  Math.min(pagesRead, totalPages),
          totalPages,
          lastPageAt: new Date(),
        },
        update: {
          pagesRead:  Math.min(pagesRead, totalPages),
          lastPageAt: new Date(),
        },
      });

      // ─── 2. DailyActivity: pagesRead++ ───────────────────────────
      const pagesIncrement = pagesRead; // foydalanuvchi bugun o'qigan sahifalar
      await tx.dailyActivity.upsert({
        where:  { userId_date: { userId, date: today } },
        create: {
          userId,
          date:      today,
          pagesRead: pagesIncrement,
          juzRead:   0,
          coinsEarned: 0,
        },
        update: { pagesRead: { increment: pagesIncrement } },
      });

      // User: totalPagesRead++
      await tx.user.update({
        where: { id: userId },
        data:  { totalPagesRead: { increment: pagesIncrement }, lastActiveAt: new Date() },
      });

      // ─── 3. Kunlik +5 BuloqCoin ──────────────────────────────────
      const { isNewDay, streakDays, streakBonus } =
        await checkAndAwardDailyActivity(tx, userId);

      let coinsEarned = isNewDay ? COIN_RULES.DAILY_ACTIVITY + streakBonus : 0;

      // ─── 4. Pora to'liq o'qildi ──────────────────────────────────
      let juzCompleted = false;
      if (isCompleting && juz.status === "RESERVED") {
        // Juz status → COMPLETED
        await tx.juz.update({
          where: { id: juz.id },
          data:  { status: "COMPLETED", completedAt: new Date() },
        });

        // +25 BuloqCoin
        await awardJuzCompleted(tx, userId, juz.juzNumber, juz.khatm.title);
        coinsEarned += COIN_RULES.JUZ_COMPLETED;
        juzCompleted = true;

        // Participation juzCount++
        await tx.participation.update({
          where: { userId_khatmId: { userId, khatmId: juz.khatmId } },
          data:  { juzCount: { increment: 1 } },
        });

        // Badge tekshirish
        await checkAndAwardBadges(tx, userId);

        // ─── 5. Xatm to'liq tugadimi? ───────────────────────────
        const completedCount = await tx.juz.count({
          where: { khatmId: juz.khatmId, status: "COMPLETED" },
        });

        if (completedCount >= 30) {
          // Khatm → COMPLETED
          await tx.khatm.update({
            where: { id: juz.khatmId },
            data:  { status: "COMPLETED", completedAt: new Date() },
          });

          // Barcha ishtirokchilar uchun bonus — separate import
          const { awardKhatmCompleted } = await import("@/lib/coins");
          const participants = await tx.participation.findMany({
            where:  { khatmId: juz.khatmId },
            select: { userId: true },
          });

          const khatm = await tx.khatm.findUnique({
            where: { id: juz.khatmId },
            select: { createdById: true, title: true },
          });

          await awardKhatmCompleted(
            tx,
            participants,
            khatm!.createdById,
            khatm!.title,
            juz.khatmId
          );
        }
      }

      return {
        progress,
        pagesRead:    Math.min(pagesRead, totalPages),
        totalPages,
        percent:      Math.round((Math.min(pagesRead, totalPages) / totalPages) * 100),
        juzCompleted,
        coinsEarned,
        isNewDay,
        streakDays,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/juz/progress]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}

/**
 * GET /api/juz/[id]/progress — hozirgi progress
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const rp = await context.params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const progress = await prisma.juzProgress.findUnique({
      where: { juzId: rp.id },
    });

    const juz = await prisma.juz.findUnique({
      where: { id: rp.id },
      select: { totalPages: true, juzNumber: true, status: true },
    });

    if (!juz) {
      return NextResponse.json({ error: "Pora topilmadi" }, { status: 404 });
    }

    const totalPages = juz.totalPages ?? JUZ_TOTAL_PAGES;
    const pagesRead  = progress?.pagesRead ?? 0;

    return NextResponse.json({
      pagesRead,
      totalPages,
      percent: Math.round((pagesRead / totalPages) * 100),
      status:  juz.status,
    });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
