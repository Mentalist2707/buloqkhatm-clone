import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JUZ_TOTAL_PAGES } from "@/lib/utils";
import {
  checkAndAwardDailyActivity,
  awardJuzCompleted,
  awardKhatmCompleted,
  checkAndAwardBadges,
} from "@/lib/coins";

/**
 * POST /api/juz/[id]/complete
 *
 * "O'qib bo'ldim" tugmasi bosilganda:
 * 1. JuzProgress → pagesRead = totalPages (to'liq o'qildi)
 * 2. Juz status → COMPLETED
 * 3. +25 BuloqCoin (awardJuzCompleted)
 * 4. Kunlik +5 coin (agar bugun birinchi marta)
 * 5. Xatm to'liq tugaganmi tekshirish
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

    const userId = session.user.id;

    const juz = await prisma.juz.findUnique({
      where: { id: rp.id },
      include: {
        khatm: {
          select: { id: true, title: true, status: true, createdById: true },
        },
      },
    });

    if (!juz) {
      return NextResponse.json({ error: "Pora topilmadi" }, { status: 404 });
    }
    if (juz.assignedToId !== userId) {
      return NextResponse.json({ error: "Bu sizning porangiz emas" }, { status: 403 });
    }
    if (juz.status !== "RESERVED") {
      return NextResponse.json({ error: "Pora holati noto'g'ri" }, { status: 400 });
    }

    const totalPages = juz.totalPages ?? JUZ_TOTAL_PAGES;

    const result = await prisma.$transaction(async (tx) => {
      // ─── 1. JuzProgress → to'liq o'qildi ────────────────────────
      await tx.juzProgress.upsert({
        where:  { juzId: juz.id },
        create: {
          juzId:      juz.id,
          userId,
          pagesRead:  totalPages,
          totalPages,
          lastPageAt: new Date(),
        },
        update: {
          pagesRead:  totalPages,
          lastPageAt: new Date(),
        },
      });

      // ─── 2. Juz → COMPLETED ──────────────────────────────────────
      await tx.juz.update({
        where: { id: juz.id },
        data:  { status: "COMPLETED", completedAt: new Date() },
      });

      // ─── 3. +25 BuloqCoin ────────────────────────────────────────
      await awardJuzCompleted(tx, userId, juz.juzNumber, juz.khatm.title);

      // ─── 4. Kunlik coin + streak ─────────────────────────────────
      const { isNewDay, streakDays, streakBonus } =
        await checkAndAwardDailyActivity(tx, userId);

      // ─── 5. Participation juzCount++ ─────────────────────────────
      await tx.participation.update({
        where: { userId_khatmId: { userId, khatmId: juz.khatmId } },
        data:  { juzCount: { increment: 1 } },
      });

      // ─── 6. User totalPages & totalJuz ──────────────────────────
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPagesRead: { increment: totalPages },
          lastActiveAt:   new Date(),
        },
      });

      // ─── 7. Badge tekshirish ─────────────────────────────────────
      await checkAndAwardBadges(tx, userId);

      // ─── 8. Xatm to'liq tugadimi? ────────────────────────────────
      let khatmCompleted = false;
      const completedCount = await tx.juz.count({
        where: { khatmId: juz.khatmId, status: "COMPLETED" },
      });

      if (completedCount >= 30) {
        await tx.khatm.update({
          where: { id: juz.khatmId },
          data:  { status: "COMPLETED", completedAt: new Date() },
        });

        const participants = await tx.participation.findMany({
          where:  { khatmId: juz.khatmId },
          select: { userId: true },
        });

        await awardKhatmCompleted(
          tx,
          participants,
          juz.khatm.createdById,
          juz.khatm.title,
          juz.khatmId
        );

        khatmCompleted = true;
      }

      return {
        juzCompleted:  true,
        khatmCompleted,
        coinsEarned:   25 + (isNewDay ? 5 + streakBonus : 0),
        streakDays,
        isNewDay,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/juz/complete]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
