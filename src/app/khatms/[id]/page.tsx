import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { KhatmDetailClient } from "./khatm-detail-client";

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
          photoUrl: true,
          username: true,
        },
      },
      juzList: {
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              photoUrl: true,
              username: true,
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
              photoUrl: true,
              coins: true,
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
              id: true, firstName: true, lastName: true,
              username: true, photoUrl: true,
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

  return (
    <MainLayout>
      <KhatmDetailClient
        khatm={JSON.parse(JSON.stringify(data.khatm))}
        isParticipant={data.isParticipant}
        isCreator={data.isCreator}
        myJuz={JSON.parse(JSON.stringify(data.myJuz))}
        userActiveJuzCount={data.userActiveJuzCount}
        userId={session.user.id}
        userRole={session.user.role}
        joinRequests={JSON.parse(JSON.stringify(data.joinRequests))}
      />
    </MainLayout>
  );
}
