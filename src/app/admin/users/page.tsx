import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminUsersClient } from "./admin-users-client";

export const metadata = { title: "Foydalanuvchilar — Admin" };

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const allowed = ["ADMIN", "SUPER_ADMIN"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participations: true, juzAssigned: true } },
    },
  });

  return (
    <MainLayout>
      <AdminUsersClient
        users={JSON.parse(JSON.stringify(users))}
        isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      />
    </MainLayout>
  );
}
