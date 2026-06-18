import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { KhatmsClient } from "./khatms-client";

export const metadata = { title: "Xatmlar" };

async function getKhatms() {
  const khatms = await prisma.khatm.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETED"] } },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
      _count: {
        select: { participations: true },
      },
      // Juz statuslari — JuzDots va progress uchun
      juzList: {
        select: {
          juzNumber: true,
          status: true,
        },
        orderBy: { juzNumber: "asc" },
      },
      // AvatarGroup uchun dastlabki 6 ta ishtirokchi
      participations: {
        take: 6,
        orderBy: { joinedAt: "desc" },
        select: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
            },
          },
        },
      },
    },
    orderBy: [
      { status: "asc" },   // ACTIVE birinchi
      { createdAt: "desc" },
    ],
  });

  return khatms;
}

export default async function KhatmsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const khatms = await getKhatms();

  return (
    <MainLayout>
      <KhatmsClient
        khatms={JSON.parse(JSON.stringify(khatms))}
        userId={session.user.id}
      />
    </MainLayout>
  );
}
