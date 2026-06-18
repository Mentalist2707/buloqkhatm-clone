import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Users, Globe, Shield, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Navbar */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-emerald flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gradient">BuloqKhatm</span>
          </div>
          <Button variant="emerald" asChild>
            <Link href="/auth/signin">Kirish</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <p className="arabic text-3xl text-emerald-700 mb-4">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Globe className="h-4 w-4" />
            Global Qur'on Xatmi Platformasi
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Dunyo bo'ylab{" "}
            <span className="text-gradient">birga xatm</span>{" "}
            qiling
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            BuloqKhatm — muslimlarni birlashtirib, Qur'onni jamoaviy xatm qilish
            imkonini beruvchi platforma. Qo'shiling, pora oling, o'qing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="emerald" size="xl" asChild>
              <Link href="/auth/signin">
                Boshlash
                <ArrowRight className="h-5 w-5 ml-1" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/khatms">Xatmlarni ko'rish</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Asosiy Imkoniyatlar</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {[
            {
              icon: BookOpen,
              title: "Jamoaviy Xatm",
              desc: "30 porah avtomatik taqsimlanadi. Har kim o'z porasini oladi va o'qiydi.",
              color: "bg-emerald-500",
            },
            {
              icon: Users,
              title: "Global Hamjamiyat",
              desc: "Dunyo bo'ylab muslimlar bilan birlashib xatm yakunlang.",
              color: "bg-blue-500",
            },
            {
              icon: Shield,
              title: "Ajr Ball Tizimi",
              desc: "Har bir o'qilgan pora uchun Ajr Ball yig'ing. Daraja ko'taring.",
              color: "bg-purple-500",
            },
            {
              icon: Globe,
              title: "Telegram Mini App",
              desc: "Telegram bot orqali ham kirish va xatmda ishtirok etish.",
              color: "bg-orange-500",
            },
            {
              icon: CheckCircle,
              title: "Pora Nazorati",
              desc: "Har bir pora holati real vaqtda kuzatiladi. Muddat eslatmalari yuboriladi.",
              color: "bg-teal-500",
            },
            {
              icon: BookOpen,
              title: "Reyting & Medallar",
              desc: "Eng faol o'quvchilar reytingda birinchi o'rinlarga chiqadi.",
              color: "bg-pink-500",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
              >
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl gradient-emerald p-10 text-white text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-3">Bugun boshlang!</h2>
            <p className="text-emerald-100 mb-6">
              Telegram yoki Google bilan kirish — 1 daqiqa
            </p>
            <Button
              variant="secondary"
              size="xl"
              asChild
              className="bg-white text-emerald-700 hover:bg-gray-50"
            >
              <Link href="/auth/signin">
                Bepul Ro'yxatdan O'tish
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        <p>© 2024 BuloqKhatm. Barcha huquqlar himoyalangan.</p>
        <p className="arabic mt-1 text-base text-emerald-600">
          رَبَّنَا تَقَبَّلْ مِنَّا
        </p>
      </footer>
    </div>
  );
}
