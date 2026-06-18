import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Bildirishnomalar" };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  // Fetch all notifications (do NOT auto-mark-read here — client handles it)
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
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
