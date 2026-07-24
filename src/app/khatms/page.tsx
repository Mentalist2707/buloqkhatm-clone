import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { KhatmsClient } from "./khatms-client";

export const metadata = { title: "Xatmlar" };
export const dynamic = "force-dynamic";

async function getKhatms(userId: string) {
  const khatms = await prisma.khatm.findMany({
    where: {
      status: { in: ["ACTIVE", "COMPLETED"] },
      // Private xatmlar faqat a'zo yoki yaratuvchiga ko'rinadi
      OR: [
        { type: "GLOBAL" },
        { createdById: userId },
        { participations: { some: { userId } } },
      ],
    },
    include: {
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
          name: true,
          photoUrl: true,
          image: true,
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
              name: true,
              photoUrl: true,
              image: true,
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
  const current = await getCurrentUser();

  const khatms = await getKhatms(current.id);

  return (
    <MainLayout>
      <KhatmsClient
        khatms={JSON.parse(JSON.stringify(khatms))}
        userId={current.id}
      />
    </MainLayout>
  );
}
