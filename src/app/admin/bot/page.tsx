import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { AdminBotClient } from "./admin-bot-client";

export const metadata = { title: "Bot Boshqaruvi — Admin" };

export default async function AdminBotPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  const allowed = ["ADMIN", "SUPER_ADMIN"];
  if (!allowed.includes(session.user.role)) redirect("/dashboard");

  return (
    <MainLayout>
      <AdminBotClient />
    </MainLayout>
  );
}
