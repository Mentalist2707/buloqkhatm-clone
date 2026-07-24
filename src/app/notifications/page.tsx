import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Bildirishnomalar" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const current = await getCurrentUser();

  const notifications = await prisma.notification.findMany({
    where: { userId: current.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <MainLayout>
      <NotificationsClient
        initialNotifications={JSON.parse(JSON.stringify(notifications))}
      />
    </MainLayout>
  );
}
