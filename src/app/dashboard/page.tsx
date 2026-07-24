import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardClient } from "./dashboard-client";
import { todayUTC } from "@/lib/utils";

export const metadata = { title: "Bosh sahifa" };
export const dynamic = "force-dynamic";

async function getDashboardData(userId: string) {
  const today = todayUTC();

  const [
    user,
    myJuzCompleted,
    myJuzTotal,
    activeKhatms,
    completedKhatms,
    myActiveJuz,
    recentKhatms,
    todayActivity,
    recentFeed,
    myBadges,
    readingBooks,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, name: true,
        photoUrl: true, image: true, coins: true, level: true,
        streakDays: true, totalJuzRead: true, totalKhatms: true,
        totalPagesRead: true, totalBooksRead: true, lastDailyAt: true,
        lastActiveAt: true,
      },
    }),

    // Mening poralarim: yakunlangan
    prisma.juz.count({ where: { status: "COMPLETED", khatm: { participations: { some: { userId } } } } }),
    // Mening xatmlarimdagi jami pora
    prisma.juz.count({ where: { khatm: { participations: { some: { userId } }, status: { in: ["ACTIVE", "COMPLETED"] } } } }),

    prisma.khatm.count({ where: { status: "ACTIVE", participations: { some: { userId } } } }),
    prisma.khatm.count({ where: { status: "COMPLETED", participations: { some: { userId } } } }),

    // Faol poralarim
    prisma.juz.findMany({
      where:   { assignedToId: userId, status: "RESERVED" },
      include: {
        khatm:    { select: { id: true, title: true } },
        progress: { select: { pagesRead: true, totalPages: true } },
      },
      take: 4,
    }),

    // Faol xatmlar
    prisma.khatm.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { createdById: userId },
          { participations: { some: { userId } } },
        ],
      },
      include: {
        _count:    { select: { participations: true } },
        juzList:   { where: { status: "COMPLETED" }, select: { id: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),

    // Bugungi faollik
    prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    }),

    // So'nggi coin tranzaksiyalar
    prisma.coinTransaction.findMany({
      where:    { userId },
      orderBy:  { createdAt: "desc" },
      take:     6,
    }),

    // Medallar
    prisma.userBadge.findMany({
      where:   { userId },
      include: { badge: true },
      take:    8,
    }),

    // O'qilayotgan kitoblar
    prisma.book.findMany({
      where:   { userId, status: "READING" },
      orderBy: { updatedAt: "desc" },
      take:    4,
    }),
  ]);

  return {
    user,
    stats: {
      juzCompleted: myJuzCompleted,
      juzTotal:     myJuzTotal,
      activeKhatms,
      completedKhatms,
    },
    myActiveJuz,
    recentKhatms,
    todayActivity,
    recentFeed,
    myBadges,
    readingBooks,
  };
}

export default async function DashboardPage() {
  const current = await getCurrentUser();
  const data = await getDashboardData(current.id);

  return (
    <MainLayout>
      <DashboardClient
        userId={current.id}
        user={JSON.parse(JSON.stringify(data.user))}
        stats={data.stats}
        myActiveJuz={JSON.parse(JSON.stringify(data.myActiveJuz))}
        recentKhatms={JSON.parse(JSON.stringify(data.recentKhatms))}
        todayActivity={JSON.parse(JSON.stringify(data.todayActivity))}
        recentFeed={JSON.parse(JSON.stringify(data.recentFeed))}
        myBadges={JSON.parse(JSON.stringify(data.myBadges))}
        readingBooks={JSON.parse(JSON.stringify(data.readingBooks))}
      />
    </MainLayout>
  );
}
