import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { JoinByCodeClient } from "./join-by-code-client";

export const metadata = { title: "Xatmga qo'shilish" };

export default async function JoinByCodePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; khatmId?: string }>;
}) {
  const session = await auth();
  const { code } = await searchParams;

  if (!session) {
    redirect(`/auth/signin?callbackUrl=/khatms/join${code ? `?code=${code}` : ""}`);
  }

  // Agar code URL da kelgan bo'lsa — xatmni topib ko'rsatamiz
  let khatmByCode = null;
  if (code) {
    khatmByCode = await prisma.khatm.findUnique({
      where: { inviteCode: code.toUpperCase() },
      select: {
        id:          true,
        title:       true,
        description: true,
        status:      true,
        type:        true,
        _count:      { select: { participations: true } },
        createdBy:   { select: { firstName: true, lastName: true } },
      },
    });
  }

  return (
    <MainLayout>
      <JoinByCodeClient
        initialCode={code ?? ""}
        khatmByCode={khatmByCode ? JSON.parse(JSON.stringify(khatmByCode)) : null}
        userId={session.user.id}
      />
    </MainLayout>
  );
}
