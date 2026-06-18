import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { KhatmsClient } from "./khatms-client";
import { maskIncognitoUser, isAdminRole } from "@/lib/utils";

export const metadata = { title: "Xatmlar" };

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
          isIncognito: true,
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
              isIncognito: true,
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

  const khatms = await getKhatms(session.user.id);
  const isAdminViewer = isAdminRole(session.user.role);

  // Inkognito ishtirokchilar va yaratuvchilarni anonimlashtirish
  const maskedKhatms = khatms.map((k: any) => {
    let n = 0;
    const participations = k.participations.map((p: any) => {
      if (p.user?.isIncognito && !isAdminViewer) {
        n += 1;
        return { ...p, user: maskIncognitoUser(p.user, false, n) };
      }
      return p;
    });
    const createdBy =
      k.createdBy?.isIncognito && !isAdminViewer
        ? maskIncognitoUser(k.createdBy, false, 1)
        : k.createdBy;
    return { ...k, participations, createdBy };
  });

  return (
    <MainLayout>
      <KhatmsClient
        khatms={JSON.parse(JSON.stringify(maskedKhatms))}
        userId={session.user.id}
      />
    </MainLayout>
  );
}
