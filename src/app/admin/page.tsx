import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata = { title: "Admin Panel" };

async function getAdminStats() {
  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    totalKhatms,
    activeKhatms,
    completedKhatms,
    totalJuz,
    completedJuz,
    totalPoints,
    recentUsers,
    recentKhatms,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true, isBanned: false } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.khatm.count(),
    prisma.khatm.count({ where: { status: "ACTIVE" } }),
    prisma.khatm.count({ where: { status: "COMPLETED" } }),
    prisma.juz.count(),
    prisma.juz.count({ where: { status: "COMPLETED" } }),
    prisma.user.aggregate({ _sum: { coins: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        photoUrl: true,
        role: true,
        coins: true,
        createdAt: true,
        isBanned: true,
      },
    }),
    prisma.khatm.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        _count: { select: { participations: true } },
      },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    totalKhatms,
    activeKhatms,
    completedKhatms,
    totalJuz,
    completedJuz,
    totalPoints: totalPoints._sum.coins ?? 0,
    recentUsers,
    recentKhatms,
  };
}

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const allowed = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  const stats = await getAdminStats();

  return (
    <MainLayout>
      <AdminDashboardClient
        stats={JSON.parse(JSON.stringify(stats))}
        userRole={session.user.role}
      />
    </MainLayout>
  );
}
