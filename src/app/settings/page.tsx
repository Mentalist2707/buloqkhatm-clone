import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MainLayout } from "@/components/layout/main-layout";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Sozlamalar" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      telegramId: true,
      role: true,
      coins: true,
      level: true,
      isIncognito: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/auth/signin");

  return (
    <MainLayout>
      <SettingsClient user={JSON.parse(JSON.stringify(user))} />
    </MainLayout>
  );
}
