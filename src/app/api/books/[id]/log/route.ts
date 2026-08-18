import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayUTC, COIN_RULES } from "@/lib/utils";
import { checkAndAwardDailyActivity, awardBookCompleted, checkAndAwardBadges } from "@/lib/coins";
import { z } from "zod";

export const dynamic = "force-dynamic";

const logSchema = z.object({
  toPage: z.number().int().min(0).optional(),   // qaysi betgacha o'qildi
  pages:  z.number().int().min(1).optional(),    // yoki: nechta bet o'qildi
  note:   z.string().max(500).optional().nullable(),
});

/**
 * POST /api/books/[id]/log — o'qishni belgilash (tarixga yoziladi)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const userId = await getCurrentUserId();

    const body   = await req.json();
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Noto'g'ri ma'lumot" }, { status: 400 });
    }

    const { toPage, pages, note } = parsed.data;

    const book = await prisma.book.findFirst({ where: { id, userId } });
    if (!book) {
      return NextResponse.json({ error: "Kitob topilmadi" }, { status: 404 });
    }
    if (book.status === "COMPLETED") {
      return NextResponse.json({ error: "Kitob allaqachon yakunlangan" }, { status: 400 });
    }
    if (book.status === "PAUSED") {
      return NextResponse.json({ error: "Kitob to'xtatilgan. Davom ettiring" }, { status: 400 });
    }

    const oldPage = book.currentPage;

    // Yangi bet raqamini aniqlaymiz
    let newPage: number;
    if (typeof toPage === "number") {
      newPage = toPage;
    } else if (typeof pages === "number") {
      newPage = oldPage + pages;
    } else {
      return NextResponse.json({ error: "toPage yoki pages kiriting" }, { status: 400 });
    }

    newPage = Math.min(Math.max(newPage, 0), book.totalPages);
    const pagesRead = newPage - oldPage;

    if (pagesRead <= 0) {
      return NextResponse.json(
        { error: "Yangi bet oldingi holatdan katta bo'lishi kerak" },
        { status: 400 }
      );
    }

    const willComplete = newPage >= book.totalPages;
    const today = todayUTC();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Kitob progressini yangilash
      await tx.book.update({
        where: { id: book.id },
        data: {
          currentPage: newPage,
          ...(willComplete && { status: "COMPLETED", completedAt: new Date() }),
        },
      });

      // 2. O'qish tarixiga yozuv
      await tx.bookReadingLog.create({
        data: {
          bookId:   book.id,
          userId,
          fromPage: oldPage + 1,
          toPage:   newPage,
          pagesRead,
          note:     note ?? null,
        },
      });

      // 3. Kunlik faollik — kitob betlari
      await tx.dailyActivity.upsert({
        where:  { userId_date: { userId, date: today } },
        create: { userId, date: today, pagesRead: 0, juzRead: 0, bookPages: pagesRead, coinsEarned: 0 },
        update: { bookPages: { increment: pagesRead } },
      });

      // 4. Kunlik +5 coin + streak
      const { isNewDay, streakDays, streakBonus } =
        await checkAndAwardDailyActivity(tx, userId);

      let coinsEarned = isNewDay ? COIN_RULES.DAILY_ACTIVITY + streakBonus : 0;

      // 5. Kitob yakunlandi?
      if (willComplete) {
        await awardBookCompleted(tx, userId, book.title, book.id);
        coinsEarned += COIN_RULES.BOOK_COMPLETED;
        await checkAndAwardBadges(tx, userId);
      }

      return { pagesRead, newPage, willComplete, coinsEarned, streakDays, isNewDay };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[POST /api/books/log]", err);
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
