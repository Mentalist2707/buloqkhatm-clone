import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { CreateKhatmForm } from "./create-khatm-form";

export const metadata = { title: "Yangi Xatm Yaratish" };

export default async function CreateKhatmPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Yangi Xatm Yaratish</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Xatm ma'lumotlarini kiriting. 30 pora avtomatik yaratiladi.
          </p>
        </div>
        <CreateKhatmForm />
      </div>
    </MainLayout>
  );
}
