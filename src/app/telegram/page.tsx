"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Status = "loading" | "authenticating" | "success" | "error" | "no-telegram";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData:       string;
        initDataUnsafe: {
          user?: {
            id:          number;
            first_name:  string;
            last_name?:  string;
            username?:   string;
            photo_url?:  string;
          };
          auth_date: number;
          hash:      string;
        };
        ready:    () => void;
        expand:   () => void;
        close:    () => void;
        colorScheme: "light" | "dark";
        themeParams: Record<string, string>;
      };
    };
  }
}

export default function TelegramMiniAppPage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const [state, setState] = useState<Status>("loading");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      // Agar allaqachon login bo'lgan bo'lsa
      if (status === "authenticated") {
        setState("success");
        setTimeout(() => router.push("/dashboard"), 800);
        return;
      }

      if (status === "loading") return;

      // Telegram WebApp mavjudligini tekshirish
      const tg = window.Telegram?.WebApp;

      if (!tg) {
        setState("no-telegram");
        return;
      }

      tg.ready();
      tg.expand();

      const initData = tg.initData;
      const tgUser   = tg.initDataUnsafe?.user;

      if (!tgUser?.id || !initData) {
        setState("no-telegram");
        return;
      }

      setState("authenticating");

      try {
        const result = await signIn("telegram-miniapp", {
          initData,
          redirect: false,
        });

        if (result?.ok) {
          setState("success");
          setTimeout(() => router.push("/dashboard"), 800);
        } else {
          setState("error");
          setError("Kirish amalga oshmadi. Qayta urinib ko'ring.");
        }
      } catch (err) {
        setState("error");
        setError("Texnik xatolik yuz berdi.");
        console.error("[MiniApp auth error]", err);
      }
    };

    run();
  }, [status, router]);

  // ── UI states ──

  if (state === "loading" || state === "authenticating") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-900 to-slate-900">
        <div className="h-16 w-16 rounded-2xl gradient-emerald flex items-center justify-center shadow-xl mb-5">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mb-3" />
        <p className="text-white/70 text-sm font-medium">
          {state === "authenticating" ? "Kirilmoqda..." : "Yuklanmoqda..."}
        </p>
        <p className="text-white/30 text-xs mt-1">BuloqKhatm</p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-900 to-slate-900">
        <div className="h-16 w-16 rounded-2xl gradient-emerald flex items-center justify-center shadow-xl mb-4 animate-bounce-slow">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <p className="text-white text-lg font-bold">Muvaffaqiyatli!</p>
        <p className="text-white/60 text-sm mt-1">Dashboard ga o'tilmoqda...</p>
      </div>
    );
  }

  if (state === "no-telegram") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-6">
        <div className="text-center max-w-xs">
          <div className="h-16 w-16 rounded-2xl gradient-emerald flex items-center justify-center shadow-xl mx-auto mb-5">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <AlertCircle className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
          <h2 className="text-white font-bold text-lg">Telegram kerak</h2>
          <p className="text-white/60 text-sm mt-2 leading-relaxed">
            Ushbu sahifa faqat Telegram Mini App orqali ishlaydi.
            Telegram bot orqali kiring.
          </p>
          <Button
            className="mt-5 bg-[#229ED9] hover:bg-[#1a8bc2] text-white w-full"
            asChild
          >
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "BuloqKhatmBot"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Telegram Bot ga o'tish
            </a>
          </Button>
          <Button variant="ghost" className="mt-2 text-white/50 w-full text-xs" asChild>
            <Link href="/auth/signin">Web orqali kirish</Link>
          </Button>
        </div>
      </div>
    );
  }

  // error state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-6">
      <div className="text-center max-w-xs">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg">Xatolik</h2>
        <p className="text-white/60 text-sm mt-2">{error}</p>
        <Button
          className="mt-5 w-full"
          variant="emerald"
          onClick={() => { setState("loading"); window.location.reload(); }}
        >
          Qayta urinish
        </Button>
      </div>
    </div>
  );
}
