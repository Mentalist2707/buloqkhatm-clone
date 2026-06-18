import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { LeaderboardClient } from "./leaderboard-client";

export const metadata = { title: "Reyting" };

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfWeek() {
  const d = new Date();
  const day = d.getDay(); // 0=Sunday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────

async function getLeaderboardData(userId: string) {
  const weekStart  = startOfWeek();
  const monthStart = startOfMonth();

  // Shared user select fields
  const userSelect = {
    id: true,
    firstName: true,
    lastName: true,
    name: true,
    username: true,
    photoUrl: true,
    image: true,
    coins: true,
    level: true,
    country: true,
    streakDays: true,
    _count: {
      select: {
        participations: true,
      },
    },
  } as const;

  const [allTime, currentUserRank] = await Promise.all([
    // All-time TOP 100
    prisma.user.findMany({
      orderBy: { coins: "desc" },
      take: 100,
      select: userSelect,
    }),
    // Current user rank (all-time)
    prisma.user.count({
      where: { coins: { gt: (await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } }))?.coins ?? 0 } },
    }),
  ]);

  // Weekly leaders — coinTransaction dan
  const weeklyPoints = await prisma.coinTransaction.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: weekStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  const monthlyPoints = await prisma.coinTransaction.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: monthStart } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  // Fetch user details for weekly/monthly
  const weeklyUserIds  = weeklyPoints.map((p) => p.userId);
  const monthlyUserIds = monthlyPoints.map((p) => p.userId);

  const [weeklyUsers, monthlyUsers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: weeklyUserIds } },
      select: userSelect,
    }),
    prisma.user.findMany({
      where: { id: { in: monthlyUserIds } },
      select: userSelect,
    }),
  ]);

  // Merge points earned this period with user data
  const mergePoints = (users: typeof weeklyUsers, pointsData: typeof weeklyPoints) =>
    pointsData
      .map((p) => {
        const user = users.find((u) => u.id === p.userId);
        if (!user) return null;
        return { ...user, periodPoints: p._sum.amount ?? 0 };
      })
      .filter(Boolean) as (typeof weeklyUsers[number] & { periodPoints: number })[];

  // Completed juz counts per user (all-time) for metrics
  const juzCounts = await prisma.juz.groupBy({
    by: ["assignedToId"],
    where: { status: "COMPLETED", assignedToId: { not: null } },
    _count: { id: true },
  });

  const completedKhatmCounts = await prisma.khatm.findMany({
    where: {
      status: "COMPLETED",
      participations: { some: {} },
    },
    select: {
      participations: { select: { userId: true } },
    },
  });

  // Build metrics maps
  const juzMap: Record<string, number> = {};
  juzCounts.forEach((j) => { if (j.assignedToId) juzMap[j.assignedToId] = j._count.id; });

  const khatmMap: Record<string, number> = {};
  completedKhatmCounts.forEach((k) => {
    k.participations.forEach((p) => {
      khatmMap[p.userId] = (khatmMap[p.userId] ?? 0) + 1;
    });
  });

  return {
    allTime,
    weekly:       mergePoints(weeklyUsers, weeklyPoints),
    monthly:      mergePoints(monthlyUsers, monthlyPoints),
    currentUserRank: currentUserRank + 1,
    juzMap,
    khatmMap,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const data = await getLeaderboardData(session.user.id);

  return (
    <MainLayout>
      <LeaderboardClient
        allTime={JSON.parse(JSON.stringify(data.allTime))}
        weekly={JSON.parse(JSON.stringify(data.weekly))}
        monthly={JSON.parse(JSON.stringify(data.monthly))}
        currentUserId={session.user.id}
        currentUserRank={data.currentUserRank}
        juzMap={data.juzMap}
        khatmMap={data.khatmMap}
      />
    </MainLayout>
  );
}
