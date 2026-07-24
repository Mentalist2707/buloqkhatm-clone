import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { ProfileClient } from "./profile-client";

export const metadata = { title: "Profilim" };
export const dynamic = "force-dynamic";

async function getProfileData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      badges: { include: { badge: true } },
      coinHistory: { orderBy: { createdAt: "desc" }, take: 10 },
      participations: {
        include: {
          khatm: { select: { id: true, title: true, status: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      _count: {
        select: {
          participations: true,
          juzAssigned: true,
        },
      },
    },
  });

  const completedJuz = await prisma.juz.count({
    where: { assignedToId: userId, status: "COMPLETED" },
  });

  const completedKhatms = await prisma.khatm.count({
    where: {
      status: "COMPLETED",
      participations: { some: { userId } },
    },
  });

  return { user, completedJuz, completedKhatms };
}

export default async function ProfilePage() {
  const current = await getCurrentUser();

  const data = await getProfileData(current.id);

  return (
    <MainLayout>
      <ProfileClient
        user={JSON.parse(JSON.stringify(data.user))}
        completedJuz={data.completedJuz}
        completedKhatms={data.completedKhatms}
      />
    </MainLayout>
  );
}
