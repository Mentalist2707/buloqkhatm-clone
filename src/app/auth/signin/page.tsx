"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookOpen, Shield, Users, Trophy, Zap, Loader2, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

declare global {
  interface Window {
    onTelegramAuth: (user: TelegramWidgetUser) => void;
  }
}

interface TelegramWidgetUser {
  id:         number;
  first_name: string;
  last_name?: string;
  username?:  string;
  photo_url?: string;
  auth_date:  number;
  hash:       string;
}

const IS_DEV = process.env.NODE_ENV === "development";

export default function SignInPage() {
  const router      = useRouter();
  const widgetRef   = useRef<HTMLDivElement>(null);
  // Telegram widget username'ni '@' yoki 't.me/' prefikssiz talab qiladi — tozalaymiz
  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "BuloqKhatmBot")
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^t\.me\//i, "");

  // Dev mode form
  const [devId,    setDevId]    = useState("");
  const [devName,  setDevName]  = useState("");
  const [loading,  setLoading]  = useState(false);

  // ── Production: Telegram Widget callback ──
  const handleTelegramAuth = useCallback(async (user: TelegramWidgetUser) => {
    try {
      const result = await signIn("telegram-widget", {
        id:         String(user.id),
        first_name: user.first_name ?? "",
        last_name:  user.last_name  ?? "",
        username:   user.username   ?? "",
        photo_url:  user.photo_url  ?? "",
        auth_date:  String(user.auth_date),
        hash:       user.hash,
        redirect:   false,
      });
      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Telegram auth error:", err);
    }
  }, [router]);

  // ── Telegram Widget script inject (production) ──
  useEffect(() => {
    if (IS_DEV) return; // dev da widget yuklamaymiz

    window.onTelegramAuth = handleTelegramAuth;
    if (!widgetRef.current) return;
    widgetRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login",  botUsername);
    script.setAttribute("data-size",            "large");
    script.setAttribute("data-onauth",          "onTelegramAuth(user)");
    script.setAttribute("data-request-access",  "write");
    script.setAttribute("data-userpic",         "true");
    script.setAttribute("data-radius",          "12");
    script.async = true;
    widgetRef.current.appendChild(script);

    return () => { if (widgetRef.current) widgetRef.current.innerHTML = ""; };
  }, [botUsername, handleTelegramAuth]);

  // ── Dev mode: oddiy form bilan kirish ──
  const handleDevLogin = async () => {
    if (!devId.trim()) return;
    setLoading(true);
    try {
      const result = await signIn("telegram-widget", {
        id:         devId.trim(),
        first_name: devName.trim() || "Test",
        last_name:  "",
        username:   `user${devId.trim()}`,
        photo_url:  "",
        auth_date:  String(Math.floor(Date.now() / 1000)),
        hash:       "dev_bypass_hash",
        redirect:   false,
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        console.error("Dev login error:", result?.error);
      }
    } catch (err) {
      console.error("Dev login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-4 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-3xl gradient-emerald flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">BuloqKhatm</h1>
          <p className="text-emerald-300 mt-1.5 text-sm font-medium">
            Global Qur'on Xatmi Platformasi
          </p>
          <p className="arabic text-emerald-400 mt-2" style={{ fontSize: "16px", lineHeight: "2" }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">

          {IS_DEV ? (
            /* ─── DEV MODE ─── */
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-3 py-2">
                <span className="text-yellow-400 text-sm">🛠️</span>
                <p className="text-yellow-300 text-xs font-semibold">
                  Development Mode — Telegram Widget localhost da ishlamaydi
                </p>
              </div>

              <div className="text-center">
                <p className="text-white/80 text-sm font-semibold">Test kirish</p>
                <p className="text-white/40 text-xs mt-0.5">
                  Istalgan Telegram ID bilan kiring
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Telegram ID *</Label>
                  <Input
                    type="number"
                    placeholder="123456789"
                    value={devId}
                    onChange={(e) => setDevId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400"
                  />
                  <p className="text-white/30 text-[10px]">
                    Haqiqiy Telegram ID ingizni kiriting
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/60 text-xs">Ismingiz (ixtiyoriy)</Label>
                  <Input
                    type="text"
                    placeholder="Firdavs"
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleDevLogin()}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-emerald-400"
                  />
                </div>
              </div>

              <Button
                className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                onClick={handleDevLogin}
                disabled={loading || !devId.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                Kirish (Dev)
              </Button>

              <div className="border-t border-white/10 pt-3">
                <p className="text-white/30 text-[10px] text-center">
                  Production da bu o'rniga Telegram Login Widget ko'rinadi
                </p>
              </div>
            </div>

          ) : (
            /* ─── PRODUCTION: Telegram Widget ─── */
            <div>
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-white">Xush kelibsiz!</h2>
                <p className="text-sm text-white/60 mt-1">
                  Telegram orqali bir marta bosib kiring
                </p>
              </div>

              {/* Widget container */}
              <div
                className="flex justify-center min-h-[56px] items-center"
                ref={widgetRef}
              >
                <div className="flex items-center gap-1.5 text-white/40">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs">Yuklanmoqda...</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-white/10 text-center">
                <p className="text-xs text-white/40">
                  Telegram ilovangiz orqali tasdiqlang
                </p>
                <p className="text-xs text-white/25 mt-0.5">
                  Hech qanday parol talab qilinmaydi
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {[
            { icon: Users,  text: "Jamoaviy xatm",  sub: "Dunyo bo'ylab"  },
            { icon: Trophy, text: "BuloqCoin",       sub: "Har pora uchun" },
            { icon: Zap,    text: "Streak tizimi",   sub: "Kunlik mukofot" },
            { icon: Shield, text: "Xavfsiz kirish",  sub: "Telegram orqali"},
          ].map((f) => (
            <div key={f.text} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <f.icon className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white leading-none">{f.text}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-white/25 mt-5">
          © 2024 BuloqKhatm
        </p>
      </div>
    </div>
  );
}
