"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen, BarChart2, Trophy, User, Bell,
  Shield, Home, Plus, BookMarked, X, Settings,
  Flame, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserLevel, getNextLevel, getLevelProgress } from "@/lib/utils";
import { useUserStats } from "@/hooks/use-user-stats";

const navItems = [
  { href: "/dashboard",        label: "Bosh sahifa",       icon: Home },
  { href: "/khatms",           label: "Xatmlar",           icon: BookOpen },
  { href: "/khatms/create",    label: "Yangi Xatm",        icon: Plus },
  { href: "/leaderboard",      label: "Reyting",           icon: Trophy },
  { href: "/notifications",    label: "Bildirishnomalar",  icon: Bell },
  { href: "/profile",          label: "Profilim",          icon: User },
  { href: "/settings",         label: "Sozlamalar",        icon: Settings },
];

const adminItems = [
  { href: "/admin",            label: "Admin Panel",       icon: Shield },
  { href: "/admin/users",      label: "Foydalanuvchilar",  icon: User },
  { href: "/admin/khatms",     label: "Xatmlar",           icon: BookMarked },
  { href: "/admin/stats",      label: "Statistika",        icon: BarChart2 },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const { data: session } = useSession();

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "SUPER_ADMIN" ||
    session?.user?.role === "MODERATOR";

  // ── Coins/streak — keshlangan hook orqali olinadi ─────────────
  // Har sahifa o'tishda qayta so'rov yubormaydi (60s kesh + deduplikatsiya)
  const { coins, streakDays } = useUserStats();

  const level    = getUserLevel(coins);
  const nextLevel = getNextLevel(coins);
  const progress = getLevelProgress(coins);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — mobile: fixed full-height, desktop: rendered inside sticky aside */}
      <aside
        className={cn(
          // Mobile: fixed overlay panel
          "fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 shadow-xl",
          // Desktop: not fixed — parent <aside> in main-layout handles sticky
          "md:static md:translate-x-0 md:z-auto md:shadow-none md:h-full md:flex md:flex-col",
          // Mobile show/hide
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl gradient-emerald flex items-center justify-center shadow-sm">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-gradient font-extrabold text-lg tracking-tight">
              BuloqKhatm
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-7 w-7 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ─── User card ─── */}
        {session && (
          <div className="px-3 pt-3">
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-3">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                  <AvatarImage src={session.user.image ?? ""} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate leading-none">
                    {session.user.name ?? "Foydalanuvchi"}
                  </p>
                  <p className={`text-[11px] font-semibold mt-0.5 ${level.color}`}>
                    {level.name}
                  </p>
                </div>
              </div>

              {/* Coins + streak row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-emerald-700">
                  <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                  <span className="text-xs font-bold">{coins} ball</span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-3 w-3" />
                  <span className="text-xs font-bold">
                    {streakDays} kun
                  </span>
                </div>
              </div>

              {/* Level progress */}
              <Progress value={progress} className="h-1.5 bg-emerald-200" />
              {nextLevel && (
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">
                  {nextLevel.name} uchun {nextLevel.minPoints - coins} ball
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Navigation ─── */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto min-h-0">
          {/* Quick Actions */}
          <div className="mb-4">
            <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Tezkor Amallar
            </p>
            <div className="space-y-1.5">
              {[
                { href: "/khatms/create", label: "Yangi Xatm",       icon: Plus,     color: "bg-emerald-500 text-white hover:bg-emerald-600" },
                { href: "/khatms",        label: "Xatmga qo'shilish", icon: BookOpen, color: "bg-blue-500 text-white hover:bg-blue-600" },
              ].map((a) => (
                <Link
                  key={a.href + a.label}
                  href={a.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    a.color
                  )}
                >
                  <a.icon className="h-3.5 w-3.5 shrink-0" />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="h-px bg-gray-100 mb-2" />
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-emerald-100 text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-emerald-600" : "text-gray-400"
                  )}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
              </Link>
            );
          })}

          {/* ─── Admin ─── */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-1.5 px-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Boshqaruv
                </p>
              </div>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-purple-100 text-purple-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-purple-500" : "text-gray-400"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* ─── Footer ─── */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <p className="text-[11px] text-center text-gray-400 font-medium">
            © 2024 BuloqKhatm
          </p>
          <p className="text-center mt-0.5 arabic text-emerald-600 font-semibold"
             style={{ fontSize: "14px", lineHeight: "1.8" }}>
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
        </div>
      </aside>
    </>
  );
}
