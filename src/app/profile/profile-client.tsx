"use client";

import Link from "next/link";
import {
  BookOpen,
  Trophy,
  Star,
  Flame,
  Calendar,
  CheckCircle2,
  Award,
  Settings,
  Clock,
  TrendingUp,
  Zap,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getUserLevel,
  getNextLevel,
  getLevelProgress,
  BADGE_CONFIG,
  LEVELS,
  formatRelativeTime,
  formatDate,
  cn,
} from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  user: any;
  completedJuz: number;
  completedKhatms: number;
}

// ─── Medal requirements ───────────────────────────────────────────────────────

const BADGE_REQUIREMENTS: Record<string, string> = {
  KHATM_1:   "1 ta jamoaviy xatmni to'liq yakunlang",
  KHATM_10:  "10 ta xatmni yakunlang",
  KHATM_50:  "50 ta xatmni yakunlang",
  KHATM_100: "100 ta xatmni yakunlang",
  STREAK_7:  "7 kun ketma-ket pora o'qing",
  STREAK_30: "30 kun ketma-ket pora o'qing",
  REFERRAL:  "Do'stingizni platformaga taklif qiling",
};

// ─── Point reason display ─────────────────────────────────────────────────────

const POINT_DISPLAY: Record<string, { icon: string; color: string; label: string }> = {
  JUZ_COMPLETED:   { icon: "📖", color: "bg-emerald-50 border-emerald-100",  label: "Pora o'qildi"       },
  KHATM_COMPLETED: { icon: "🎉", color: "bg-blue-50 border-blue-100",        label: "Xatm yakunlandi"    },
  STREAK_7_DAYS:   { icon: "🔥", color: "bg-orange-50 border-orange-100",    label: "7 kun streak"       },
  REFERRAL:        { icon: "🤝", color: "bg-purple-50 border-purple-100",    label: "Do'st taklif"       },
  ADMIN_BONUS:     { icon: "⭐", color: "bg-yellow-50 border-yellow-100",    label: "Admin bonus"        },
};

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <div className="relative mb-3">
        <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
          {icon}
        </div>
        {/* subtle rings */}
        <div className="absolute inset-0 rounded-2xl ring-8 ring-gray-50/60 ring-offset-0 -z-10" />
      </div>
      <p className="font-semibold text-gray-500 text-sm">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1 max-w-[180px] leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileClient({ user, completedJuz, completedKhatms }: Props) {
  const points    = user?.coins ?? 0;
  const level     = getUserLevel(points);
  const nextLevel = getNextLevel(points);
  const progress  = getLevelProgress(points);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
            || user?.name
            || "Foydalanuvchi";

  const initials = name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  const avatar  = user?.photoUrl ?? user?.image ?? "";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5 max-w-3xl mx-auto">

        {/* ─── 1. Profile Banner ──────────────────────────────────── */}
        <Card className="overflow-hidden border-0 shadow-sm">
          {/* Gradient top */}
          <div className="relative gradient-emerald-dark pt-8 pb-16 px-6">
            {/* Bg decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/5" />
              <div className="absolute right-24 bottom-0 h-24 w-24 rounded-full bg-white/5" />
            </div>

            {/* Settings link top right */}
            <Link
              href="/settings"
              className="absolute top-4 right-4 h-8 w-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              title="Sozlamalar"
            >
              <Settings className="h-4 w-4 text-white" />
            </Link>

            {/* Name + joined date */}
            <div className="relative z-10">
              <p className="text-white text-xl font-bold">{name}</p>
              {user?.username && (
                <p className="text-emerald-200 text-sm mt-0.5">@{user.username}</p>
              )}
              {user?.createdAt && (
                <p className="text-emerald-300 text-xs mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Ro'yxatdan o'tdi: {formatDate(user.createdAt)}
                </p>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full glass-card", level.color)}>
                  {level.name}
                </span>
                {points > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full glass-card text-yellow-200 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                    {points.toLocaleString()} ball
                  </span>
                )}
                {(user?.streakDays ?? 0) > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full glass-card text-orange-200 flex items-center gap-1">
                    🔥 {user.streakDays} kun streak
                  </span>
                )}
                {user?.role !== "USER" && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full glass-card text-purple-200">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Avatar overlapping */}
          <div className="relative px-6 pb-4">
            <div className="-mt-10 flex items-end justify-between">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-4 ring-white">
                <AvatarFallback className="text-2xl bg-emerald-100 text-emerald-700 font-extrabold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Quick stats inline */}
              <div className="flex items-center gap-3 mb-1">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{completedJuz}</p>
                  <p className="text-[10px] text-muted-foreground">Pora</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{completedKhatms}</p>
                  <p className="text-[10px] text-muted-foreground">Xatm</p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">{user?._count?.participations ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">Ishtirok</p>
                </div>
              </div>
            </div>

            {/* Email */}
            {user?.email && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                {user.email}
              </p>
            )}
          </div>
        </Card>

        {/* ─── 2. Level Progress ──────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-purple-600" />
              </div>
              Daraja Progressi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", level.bg, level.color)}>
                  {level.name}
                </span>
                <div className="flex-1">
                  <Progress value={progress} className="h-3 bg-purple-50" />
                </div>
                {nextLevel ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                    {nextLevel.name}
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
                    MAX 🏆
                  </span>
                )}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {nextLevel
                  ? <><span className="font-semibold text-purple-600">{nextLevel.name}</span> darajasiga <span className="font-bold">{(nextLevel.minPoints - points).toLocaleString()}</span> ball yetishmayapti</>
                  : <span className="text-yellow-600 font-semibold">🎊 Maksimal darajaga erishdingiz!</span>}
              </p>
            </div>

            {/* All levels grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {LEVELS.map((l) => {
                const reached = points >= l.minPoints;
                const isCurrent = l.name === level.name;
                return (
                  <Tooltip key={l.name}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "rounded-xl p-2 text-center border-2 transition-all cursor-default",
                        isCurrent
                          ? `${l.bg} border-current ${l.color} shadow-sm scale-105`
                          : reached
                          ? `${l.bg} border-transparent opacity-80`
                          : "bg-gray-50 border-transparent opacity-40"
                      )}>
                        <p className="text-xl">
                          {l.minPoints === 0 ? "🌱" :
                           l.minPoints === 100 ? "📖" :
                           l.minPoints === 500 ? "📚" :
                           l.minPoints === 1000 ? "🌟" :
                           l.minPoints === 5000 ? "👑" : "💎"}
                        </p>
                        <p className={cn("text-[10px] font-semibold mt-0.5 leading-tight", reached ? l.color : "text-gray-400")}>
                          {l.minPoints === 0 ? "0" : l.minPoints >= 1000 ? `${l.minPoints / 1000}K` : l.minPoints}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.minPoints === 0 ? "Boshlang'ich daraja" : `${l.minPoints.toLocaleString()} ball kerak`}
                      </p>
                      {isCurrent && <p className="text-xs text-emerald-600 font-medium mt-0.5">✓ Hozirgi darajangiz</p>}
                      {reached && !isCurrent && <p className="text-xs text-emerald-600 mt-0.5">✓ Erishildi</p>}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── 3. Stats grid ──────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "O'qilgan Poralar",   value: completedJuz,                       icon: BookOpen,    color: "text-emerald-600 bg-emerald-100" },
            { label: "Yakunlangan Xatm",   value: completedKhatms,                    icon: CheckCircle2,color: "text-blue-600 bg-blue-100" },
            { label: "Ishtirok Etgan",      value: user?._count?.participations ?? 0, icon: Trophy,      color: "text-purple-600 bg-purple-100" },
            { label: "Streak Kunlar",       value: user?.streakDays ?? 0,             icon: Flame,       color: "text-orange-600 bg-orange-100" },
          ].map((stat) => (
            <Card key={stat.label} className="card-hover border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── 4. Medals ──────────────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Award className="h-4 w-4 text-yellow-600" />
              </div>
              Medallar
              <Badge variant="outline" className="ml-auto text-xs">
                {user?.badges?.length ?? 0}/{Object.keys(BADGE_CONFIG).length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* All possible badges — earned + locked */}
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(BADGE_CONFIG).map(([type, config]) => {
                const earned = user?.badges?.find((ub: any) => ub.badge?.type === type);
                const req    = BADGE_REQUIREMENTS[type] ?? "Shartni bajaring";

                return (
                  <Tooltip key={type}>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-default",
                        earned
                          ? "bg-yellow-50 border-yellow-200 shadow-sm"
                          : "bg-gray-50/50 border-gray-100 opacity-60"
                      )}>
                        <span className={cn("text-3xl shrink-0", !earned && "grayscale opacity-50")}>
                          {config.icon}
                        </span>
                        <div className="min-w-0">
                          <p className={cn(
                            "font-semibold text-sm leading-none",
                            earned ? "text-yellow-800" : "text-gray-500"
                          )}>
                            {config.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                            {config.description}
                          </p>
                          {earned ? (
                            <p className="text-[10px] text-yellow-600 font-medium mt-1 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              {formatDate(earned.earnedAt)}
                            </p>
                          ) : (
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              Qulfli
                            </p>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {earned ? (
                        <>
                          <p className="font-semibold text-yellow-700">✓ Medal qo'lga kiritildi!</p>
                          <p className="text-xs text-muted-foreground">{formatDate(earned.earnedAt)}</p>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">Qanday olish mumkin?</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{req}</p>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {(user?.badges?.length ?? 0) === 0 && (
              <EmptyState
                icon={<Award className="h-6 w-6 text-gray-300" />}
                title="Hali medal yo'q"
                subtitle="Xatmlarni yakunlab birinchi medalingizni qo'lga kiriting!"
              />
            )}
          </CardContent>
        </Card>

        {/* ─── 5. Point History — Timeline ────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                Ajr Ball Tarixi
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium">
                Jami: <span className="text-emerald-600 font-bold">{points.toLocaleString()}</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {(user?.coinHistory?.length ?? 0) > 0 ? (
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-300 via-emerald-200 to-transparent" />

                <div className="space-y-1">
                  {user.coinHistory.map((ph: any, idx: number) => {
                    const display = POINT_DISPLAY[ph.reason] ?? {
                      icon: "⭐", color: "bg-gray-50 border-gray-100", label: ph.reason
                    };
                    const isPositive = ph.amount > 0;

                    return (
                      <div key={ph.id} className="flex items-start gap-3 pl-1">
                        {/* Timeline dot */}
                        <div className={cn(
                          "relative z-10 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border text-base",
                          display.color
                        )}>
                          {display.icon}
                        </div>

                        {/* Content */}
                        <div className={cn(
                          "flex-1 flex items-center justify-between gap-2 py-2 px-3 rounded-xl border transition-colors",
                          display.color,
                          "hover:shadow-sm"
                        )}>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {ph.description ?? display.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(ph.createdAt)}
                            </p>
                          </div>
                          <span className={cn(
                            "text-sm font-extrabold shrink-0",
                            isPositive ? "text-emerald-600" : "text-red-500"
                          )}>
                            {isPositive ? "+" : ""}{ph.amount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<Star className="h-6 w-6 text-gray-300" />}
                title="Ball tarixi yo'q"
                subtitle="Pora o'qib birinchi Ajr Ballingizni yig'ing!"
              />
            )}
          </CardContent>
        </Card>

        {/* ─── 6. Participations ──────────────────────────────────── */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              Ishtirok Etgan Xatmlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(user?.participations?.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {user.participations.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/khatms/${p.khatm.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl gradient-emerald flex items-center justify-center shrink-0">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate group-hover:text-emerald-700 transition-colors">
                          {p.khatm.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.joinedAt)} • {p.juzCount} pora
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          p.khatm.status === "ACTIVE"     ? "active" :
                          p.khatm.status === "COMPLETED"  ? "completed" : "draft"
                        }
                        className="text-[10px]"
                      >
                        {p.khatm.status === "ACTIVE"    ? "Faol" :
                         p.khatm.status === "COMPLETED" ? "Yakunlangan" : "Qoralama"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<BookOpen className="h-6 w-6 text-gray-300" />}
                title="Hali xatm yo'q"
                subtitle="Xatmga qo'shilib Qur'on o'qishni boshlang!"
              />
            )}

            {(user?.participations?.length ?? 0) === 0 && (
              <div className="mt-4 text-center">
                <Button variant="emerald" size="sm" asChild>
                  <Link href="/khatms">
                    <BookOpen className="h-4 w-4 mr-1.5" />
                    Xatmlarni ko'rish
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
