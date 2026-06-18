import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminStatsClient } from "./admin-stats-client";

export const metadata = { title: "Statistika — Admin" };

export default async function AdminStatsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const allowed = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  const [
    totalUsers,
    totalKhatms,
    activeKhatms,
    completedKhatms,
    totalJuz,
    completedJuz,
    totalPoints,
    topCountries,
    topUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.khatm.count(),
    prisma.khatm.count({ where: { status: "ACTIVE" } }),
    prisma.khatm.count({ where: { status: "COMPLETED" } }),
    prisma.juz.count(),
    prisma.juz.count({ where: { status: "COMPLETED" } }),
    prisma.user.aggregate({ _sum: { coins: true } }),
    prisma.user.groupBy({
      by: ["country"],
      _count: true,
      where: { country: { not: null } },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.user.findMany({
      orderBy: { coins: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        coins: true,
        level: true,
        country: true,
      },
    }),
  ]);

  return (
    <MainLayout>
      <AdminStatsClient
        stats={{
          totalUsers,
          totalKhatms,
          activeKhatms,
          completedKhatms,
          totalJuz,
          completedJuz,
          totalPoints: totalPoints._sum.coins ?? 0,
        }}
        topCountries={topCountries}
        topUsers={topUsers}
      />
    </MainLayout>
  );
}
