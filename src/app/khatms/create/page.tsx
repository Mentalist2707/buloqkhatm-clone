import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { CreateKhatmForm } from "./create-khatm-form";

export const metadata = { title: "Yangi Xatm Yaratish" };

export default async function CreateKhatmPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto w-full">
        {/* Back link */}
        <Link
          href="/khatms"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Xatmlarga qaytish
        </Link>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl gradient-emerald flex items-center justify-center shadow-sm shrink-0">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">Yangi Xatm Yaratish</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Ma'lumotlarni kiriting — 30 pora avtomatik yaratiladi.
            </p>
          </div>
        </div>

        <CreateKhatmForm />
      </div>
    </MainLayout>
  );
}
