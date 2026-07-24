import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Sozlamalar" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const current = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { id: current.id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      photoUrl: true,
      image: true,
      country: true,
      coins: true,
      level: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  return (
    <MainLayout>
      <SettingsClient user={JSON.parse(JSON.stringify(user))} />
    </MainLayout>
  );
}
