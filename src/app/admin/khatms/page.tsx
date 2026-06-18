import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminKhatmsClient } from "./admin-khatms-client";

export const metadata = { title: "Xatmlar Boshqaruvi — Admin" };

export default async function AdminKhatmsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const allowed = ["ADMIN", "SUPER_ADMIN", "MODERATOR"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  const khatms = await prisma.khatm.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { participations: true, juzList: true } },
      juzList: { select: { status: true } },
    },
  });

  return (
    <MainLayout>
      <AdminKhatmsClient
        khatms={JSON.parse(JSON.stringify(khatms))}
        userRole={session.user.role}
      />
    </MainLayout>
  );
}
