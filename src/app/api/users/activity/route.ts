import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todayUTC } from "@/lib/utils";

// GET /api/users/activity — oxirgi 7 kun faollik + bugungi
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Kirish talab qilinadi" }, { status: 401 });
    }

    const today = todayUTC();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [weekActivity, todayActivity, recentCoins] = await Promise.all([
      // Haftalik faollik
      prisma.dailyActivity.findMany({
        where: {
          userId: session.user.id,
          date:   { gte: sevenDaysAgo },
        },
        orderBy: { date: "asc" },
      }),

      // Bugungi
      prisma.dailyActivity.findUnique({
        where: {
          userId_date: { userId: session.user.id, date: today },
        },
      }),

      // So'nggi 5 ta coin tranzaksiya (activity stream uchun)
      prisma.coinTransaction.findMany({
        where:   { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take:    8,
        select: {
          id:          true,
          amount:      true,
          reason:      true,
          description: true,
          createdAt:   true,
          metadata:    true,
        },
      }),
    ]);

    return NextResponse.json({ weekActivity, todayActivity, recentCoins });
  } catch {
    return NextResponse.json({ error: "Server xatosi" }, { status: 500 });
  }
}
