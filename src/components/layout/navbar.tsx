"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
  Shield,
  Star,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserLevel } from "@/lib/utils";

interface NavbarProps {
  onMenuToggle?: () => void;
}

// ─── Modul darajasidagi kesh ──────────────────────────────────────────────────
// Sahifa o'tishlarda unread so'rovi darhol qayta yuborilmasligi uchun.
let unreadCache = 0;
let unreadAt = 0;
const UNREAD_TTL = 30_000; // 30 soniya

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount,  setUnreadCount]  = useState(unreadCache);

  const fetchUnread = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/notifications/unread");
      if (res.ok) {
        const data = await res.json();
        const c = data.count ?? 0;
        unreadCache = c;
        unreadAt = Date.now();
        setUnreadCount(c);
      }
    } catch { /* silent */ }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    // Kesh yangi bo'lsa — darhol uni ko'rsatamiz, qayta so'ramaymiz
    if (Date.now() - unreadAt < UNREAD_TTL) {
      setUnreadCount(unreadCache);
    } else {
      fetchUnread();
    }
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnread, session]);

  const coins    = session?.user?.coins ?? (session?.user as any)?.points ?? 0;
  const userLevel = session ? getUserLevel(coins) : null;

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "SUPER_ADMIN";

  return (
    <header className="w-full h-14 border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-14 items-center gap-3 px-4">

        {/* ── Mobile hamburger ── */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100 shrink-0"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ── Logo (faqat mobile da ko'rinadi, desktop da sidebar da bor) ── */}
        <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
          <div className="h-7 w-7 rounded-lg gradient-emerald flex items-center justify-center shadow-sm">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span className="text-gradient text-base font-extrabold tracking-tight">
            BuloqKhatm
          </span>
        </Link>

        {/* ── Desktop: app name + status (sidebar yopiq bo'lganda) ── */}
        <div className="hidden md:flex items-center gap-2.5">
          <div>
            <p className="text-sm font-bold text-gray-800 leading-none">BuloqKhatm</p>
            <p className="text-[10px] text-emerald-500 font-medium mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Online
            </p>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Right: utility icons only ── */}
        {session ? (
          <div className="flex items-center gap-1">

            {/* Search (desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              title="Qidiruv (tez orada)"
              disabled
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              <Link href="/notifications">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center px-0.5 ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-gray-100 transition-all duration-150 ml-1"
              >
                <Avatar className="h-7 w-7 border-2 border-emerald-100">
                  <AvatarImage src={session.user.image ?? ""} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold leading-none text-gray-800">
                    {session.user.name?.split(" ")[0] ?? "Foydalanuvchi"}
                  </p>
                  {userLevel && (
                    <p className={`text-[10px] font-medium mt-0.5 ${userLevel.color}`}>
                      {userLevel.name}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`h-3 w-3 text-gray-400 hidden sm:block transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-gray-100 bg-white shadow-xl z-20 overflow-hidden">

                    {/* User info header */}
                    <div className="px-4 py-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                          <AvatarImage src={session.user.image ?? ""} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate leading-none">
                            {session.user.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {session.user.email}
                          </p>
                        </div>
                      </div>
                      {userLevel && (
                        <div className="flex items-center justify-between mt-2">
                          <Badge className={`text-[10px] px-2 py-0.5 border-0 ${userLevel.bg} ${userLevel.color}`}>
                            {userLevel.name}
                          </Badge>
                          <div className="flex items-center gap-1 text-yellow-600">
                            <span className="text-sm">🪙</span>
                            <span className="text-xs font-bold">{coins}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      {[
                        { href: "/profile",  icon: User,     label: "Profilim"    },
                        { href: "/settings", icon: Settings, label: "Sozlamalar"  },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <item.icon className="h-4 w-4 text-gray-400" />
                          {item.label}
                        </Link>
                      ))}

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <Shield className="h-4 w-4 text-purple-400" />
                          Admin Panel
                        </Link>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-gray-100 py-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 text-red-400" />
                        Hisobdan chiqish
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <Button variant="emerald" asChild size="sm" className="shadow-sm h-8 text-xs">
            <Link href="/auth/signin">Kirish</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
