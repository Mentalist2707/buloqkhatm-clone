import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { StatsClient } from "./leaderboard-client";

export const metadata = { title: "Statistika" };
export const dynamic = "force-dynamic";

function daysAgoUTC(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function getStats(userId: string) {
  const since = daysAgoUTC(13); // oxirgi 14 kun

  const [user, dailyActivities, recentCoins, recentBookLogs, completedKhatms, completedBooks] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, firstName: true, lastName: true,
          coins: true, level: true, streakDays: true,
          totalPagesRead: true, totalJuzRead: true,
          totalKhatms: true, totalBooksRead: true, createdAt: true,
        },
      }),
      prisma.dailyActivity.findMany({
        where:   { userId, date: { gte: since } },
        orderBy: { date: "asc" },
      }),
      prisma.coinTransaction.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        take:    15,
      }),
      prisma.bookReadingLog.findMany({
        where:   { userId },
        orderBy: { date: "desc" },
        take:    10,
        include: { book: { select: { id: true, title: true } } },
      }),
      prisma.khatm.count({
        where: { status: "COMPLETED", participations: { some: { userId } } },
      }),
      prisma.book.count({ where: { userId, status: "COMPLETED" } }),
    ]);

  return { user, dailyActivities, recentCoins, recentBookLogs, completedKhatms, completedBooks };
}

export default async function StatsPage() {
  const current = await getCurrentUser();
  const data = await getStats(current.id);

  return (
    <MainLayout>
      <StatsClient
        user={JSON.parse(JSON.stringify(data.user))}
        dailyActivities={JSON.parse(JSON.stringify(data.dailyActivities))}
        recentCoins={JSON.parse(JSON.stringify(data.recentCoins))}
        recentBookLogs={JSON.parse(JSON.stringify(data.recentBookLogs))}
        completedKhatms={data.completedKhatms}
        completedBooks={data.completedBooks}
      />
    </MainLayout>
  );
}
