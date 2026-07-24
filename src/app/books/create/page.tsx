import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { CreateBookForm } from "./create-book-form";

export const metadata = { title: "Yangi Kitob" };

export default function CreateBookPage() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto w-full">
        <Link
          href="/books"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Kitoblarga qaytish
        </Link>

        <div className="flex items-start gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-blue-500 flex items-center justify-center shadow-sm shrink-0">
            <Library className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">Yangi Kitob Rejasi</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Kitob ma'lumotlarini kiriting — kunlik o'qish rejasi avtomatik hisoblanadi.
            </p>
          </div>
        </div>

        <CreateBookForm />
      </div>
    </MainLayout>
  );
}
