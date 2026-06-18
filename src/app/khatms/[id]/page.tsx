import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { KhatmDetailClient } from "./khatm-detail-client";
import { maskIncognitoUser, isAdminRole } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const khatm = await prisma.khatm.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: khatm?.title ?? "Xatm" };
}

async function getKhatmDetail(id: string, userId: string) {
  const khatm = await prisma.khatm.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          photoUrl: true,
          image: true,
          username: true,
          isIncognito: true,
        },
      },
      juzList: {
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              photoUrl: true,
              image: true,
              username: true,
              isIncognito: true,
            },
          },
          progress: {
            select: {
              pagesRead:  true,
              totalPages: true,
            },
          },
        },
        orderBy: { juzNumber: "asc" },
      },
      participations: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              photoUrl: true,
              image: true,
              coins: true,
              isIncognito: true,
            },
          },
        },
      },
      _count: { select: { participations: true } },
    },
  });

  if (!khatm) return null;

  const isParticipant = khatm.participations.some((p) => p.userId === userId);
  const isCreator = khatm.createdById === userId;

  // User's active juz
  const myJuz = khatm.juzList.filter(
    (j) => j.assignedToId === userId && j.status === "RESERVED"
  );

  const userActiveJuzCount = await prisma.juz.count({
    where: {
      assignedToId: userId,
      status:       "RESERVED",
      khatm:        { type: khatm.type },
    },
  });

  // Creator uchun pending so'rovlar (faqat private xatm)
  const joinRequests = khatm.isPrivate && isCreator
    ? await prisma.joinRequest.findMany({
        where:   { khatmId: id, status: "PENDING" },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, name: true,
              username: true, photoUrl: true, image: true, isIncognito: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return {
    khatm,
    isParticipant,
    isCreator,
    myJuz,
    userActiveJuzCount,
    joinRequests,
  };
}

export default async function KhatmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const { id } = await params;
  const data = await getKhatmDetail(id, session.user.id);
  if (!data) notFound();

  const isAdmin = isAdminRole(session.user.role);

  // Private xatm faqat a'zo / yaratuvchi / admin ga ko'rinadi
  if (data.khatm.isPrivate && !data.isParticipant && !data.isCreator && !isAdmin) {
    notFound();
  }

  // Inkognito foydalanuvchilarni anonimlashtirish (bir xil user — bir xil raqam, o'zini ko'radi)
  const incoMap = new Map<string, number>();
  let incoCounter = 0;
  const maskU = (u: any): any => {
    if (!u || !u.isIncognito || isAdmin || u.id === session.user.id) return u;
    let idx = incoMap.get(u.id);
    if (!idx) { incoCounter += 1; idx = incoCounter; incoMap.set(u.id, idx); }
    return maskIncognitoUser(u, false, idx);
  };

  const maskedKhatm = {
    ...data.khatm,
    createdBy: maskU(data.khatm.createdBy),
    juzList: data.khatm.juzList.map((j: any) => ({ ...j, assignedTo: maskU(j.assignedTo) })),
    participations: data.khatm.participations.map((p: any) => ({ ...p, user: maskU(p.user) })),
  };
  const maskedJoinRequests = data.joinRequests.map((r: any) => ({ ...r, user: maskU(r.user) }));

  return (
    <MainLayout>
      <KhatmDetailClient
        khatm={JSON.parse(JSON.stringify(maskedKhatm))}
        isParticipant={data.isParticipant}
        isCreator={data.isCreator}
        myJuz={JSON.parse(JSON.stringify(data.myJuz))}
        userActiveJuzCount={data.userActiveJuzCount}
        userId={session.user.id}
        userRole={session.user.role}
        joinRequests={JSON.parse(JSON.stringify(maskedJoinRequests))}
      />
    </MainLayout>
  );
}
