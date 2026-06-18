import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { DashboardClient } from "./dashboard-client";
import { todayUTC } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const today = todayUTC();

  const [
    user,
    globalJuzCompleted,
    globalJuzTotal,
    globalUsers,
    activeKhatms,
    completedKhatms,
    myActiveJuz,
    recentKhatms,
    topUsers,
    todayActivity,
    recentFeed,
    myBadges,
  ] = await Promise.all([
    // Full user with coins/streak
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true, name: true,
        photoUrl: true, image: true, coins: true, level: true,
        streakDays: true, totalJuzRead: true, totalKhatms: true,
        totalPagesRead: true, lastDailyAt: true, telegramId: true,
        lastActiveAt: true,
      },
    }),

    // Global progress: completed juz
    prisma.juz.count({ where: { status: "COMPLETED" } }),
    // Total juz in all active+completed khatms
    prisma.juz.count({ where: { khatm: { status: { in: ["ACTIVE", "COMPLETED"] } } } }),
    // Total active users
    prisma.user.count({ where: { isBanned: false } }),

    prisma.khatm.count({ where: { status: "ACTIVE" } }),
    prisma.khatm.count({ where: { status: "COMPLETED" } }),

    // My active juz
    prisma.juz.findMany({
      where:   { assignedToId: userId, status: "RESERVED" },
      include: {
        khatm:    { select: { id: true, title: true } },
        progress: { select: { pagesRead: true, totalPages: true } },
      },
      take: 4,
    }),

    // Active khatms
    prisma.khatm.findMany({
      where: { status: "ACTIVE" },
      include: {
        _count:    { select: { participations: true } },
        juzList:   { where: { status: "COMPLETED" }, select: { id: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),

    // Top 5 users (by coins)
    prisma.user.findMany({
      orderBy: { coins: "desc" },
      take: 5,
      select: {
        id: true, firstName: true, lastName: true,
        photoUrl: true, coins: true, level: true, streakDays: true,
      },
    }),

    // Bugungi faollik
    prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    }),

    // Live feed — so'nggi 6 ta coin transaction (barcha userlar)
    prisma.coinTransaction.findMany({
      orderBy:  { createdAt: "desc" },
      take:     6,
      include:  { user: { select: { firstName: true, lastName: true, photoUrl: true } } },
    }),

    // My badges
    prisma.userBadge.findMany({
      where:   { userId },
      include: { badge: true },
      take:    6,
    }),
  ]);

  return {
    user,
    global: {
      juzCompleted: globalJuzCompleted,
      juzTotal:     globalJuzTotal,
      users:        globalUsers,
      activeKhatms,
      completedKhatms,
    },
    myActiveJuz,
    recentKhatms,
    topUsers,
    todayActivity,
    recentFeed,
    myBadges,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const data = await getDashboardData(session.user.id);

  return (
    <MainLayout>
      <DashboardClient
        session={session}
        user={JSON.parse(JSON.stringify(data.user))}
        global={data.global}
        myActiveJuz={JSON.parse(JSON.stringify(data.myActiveJuz))}
        recentKhatms={JSON.parse(JSON.stringify(data.recentKhatms))}
        topUsers={JSON.parse(JSON.stringify(data.topUsers))}
        todayActivity={JSON.parse(JSON.stringify(data.todayActivity))}
        recentFeed={JSON.parse(JSON.stringify(data.recentFeed))}
        myBadges={JSON.parse(JSON.stringify(data.myBadges))}
      />
    </MainLayout>
  );
}
