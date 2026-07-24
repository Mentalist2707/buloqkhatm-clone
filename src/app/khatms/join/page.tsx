import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { JoinByCodeClient } from "./join-by-code-client";

export const metadata = { title: "Xatmga qo'shilish" };
export const dynamic = "force-dynamic";

export default async function JoinByCodePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; khatmId?: string }>;
}) {
  const current = await getCurrentUser();
  const { code } = await searchParams;

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
        userId={current.id}
      />
    </MainLayout>
  );
}
