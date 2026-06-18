"use client";

import Link from "next/link";
import { Session } from "next-auth";
import {
  BookOpen, Users, CheckCircle2, Flame, ArrowRight,
  Clock, Trophy, Star, Plus, Zap, TrendingUp,
  Target, Award, Globe, Bot, ChevronRight,
  Coins, BarChart2, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  getUserLevel, getNextLevel, getLevelProgress,
  getKhatmProgress, JUZ_NAMES, formatRelativeTime,
  BADGE_CONFIG, COIN_REASON_DISPLAY, cn,
} from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  session:        Session;
  user:           any;
  global: {
    juzCompleted: number;
    juzTotal:     number;
    users:        number;
    activeKhatms: number;
    completedKhatms: number;
  };
  myActiveJuz:   any[];
  recentKhatms:  any[];
  topUsers:      any[];
  todayActivity: any | null;
  recentFeed:    any[];
  myBadges:      any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(u: any) {
  const n = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.name || "?";
  return n.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ user, todayActivity }: { user: any; todayActivity: any }) {
  const coins      = user?.coins ?? 0;
  const streak     = user?.streakDays ?? 0;
  const totalJuz   = user?.totalJuzRead ?? 0;
  const level      = getUserLevel(coins);
  const nextLevel  = getNextLevel(coins);
  const lvlProgress = getLevelProgress(coins);

  const todayCoins = todayActivity?.coinsEarned ?? 0;
  const todayPages = todayActivity?.pagesRead   ?? 0;
  const todayJuz   = todayActivity?.juzRead     ?? 0;
  const dailyGoalMet = todayJuz >= 1;

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
            || user?.name || "Aziz foydalanuvchi";

  return (
    <div className="relative overflow-hidden rounded-2xl gradient-emerald-dark text-white shadow-xl">
      {/* bg blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute left-1/3 top-0 h-24 w-24 rounded-full bg-emerald-400/10" />
      </div>

      <div className="relative z-10 p-5 sm:p-6">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-emerald-200 text-sm font-medium">Assalomu alaykum,</p>
            <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">{name} 👋</h1>
            <p className="text-emerald-200 text-xs mt-1">
              {dailyGoalMet
                ? "🎉 Bugungi maqsadingizga yetdingiz! Davom eting"
                : "📖 Bugun ham Qur'on o'qishni davom ettiring"}
            </p>
          </div>
          <Avatar className="h-14 w-14 border-2 border-white/30 shadow-lg shrink-0">
            <AvatarFallback className="text-lg bg-white/20 text-white font-extrabold">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            { icon: "📖", label: "Jami Pora",  value: totalJuz },
            { icon: "⭐", label: "Ball",        value: coins    },
            { icon: "🪙", label: "BuloqCoin",  value: coins    },
            { icon: "🔥", label: "Streak",     value: `${streak} kun` },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl leading-none">{s.icon}</p>
              <p className="text-lg font-black leading-none mt-1">{s.value}</p>
              <p className="text-[10px] text-white/70 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Daily goal progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-100">
              🎯 Bugungi maqsad — 1 pora o'qish
            </span>
            <span className="text-xs font-bold text-white">
              {dailyGoalMet ? "✅ Bajarildi!" : `${todayJuz}/1`}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                dailyGoalMet ? "bg-yellow-300" : "bg-white/70"
              )}
              style={{ width: `${Math.min(100, todayJuz * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/60 mt-1">
            <span>+25 BuloqCoin (pora uchun)</span>
            <span>Bugun: {todayPages} bet o'qildi</span>
          </div>
        </div>

        {/* Level progress */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Daraja: <span className={cn("font-bold", level.color.replace("text-", "text-") )}>{level.name}</span>
            </span>
            {nextLevel && (
              <span className="text-[10px] text-white/60">
                {nextLevel.name} → {nextLevel.minPoints - coins} ball
              </span>
            )}
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-300 to-emerald-300 rounded-full transition-all duration-700"
              style={{ width: `${lvlProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Global Progress Card ─────────────────────────────────────────────────────

function GlobalProgressCard({ global }: { global: Props["global"] }) {
  const pct = global.juzTotal > 0
    ? Math.round((global.juzCompleted / global.juzTotal) * 100)
    : 0;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-1 w-full gradient-emerald" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Globe className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Global Xatm Holati</p>
              <p className="text-xs text-muted-foreground">
                Barcha faol xatmlardagi progress
              </p>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600">{pct}%</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full gradient-emerald rounded-full transition-all duration-1000 relative"
              style={{ width: `${pct}%` }}
            >
              {pct > 5 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white font-bold">
                  {pct}%
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-600">
              {global.juzCompleted.toLocaleString()} pora o'qildi
            </span>
            <span>
              {global.juzTotal.toLocaleString()} ta jami pora
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Ishtirokchi", value: global.users,          icon: "👥" },
            { label: "Faol Xatm",  value: global.activeKhatms,   icon: "📖" },
            { label: "Yakunlangan",value: global.completedKhatms, icon: "✅" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2.5 rounded-xl bg-emerald-50">
              <p className="text-base">{s.icon}</p>
              <p className="text-lg font-black text-emerald-700 leading-none">{s.value}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Daily Challenge Card ─────────────────────────────────────────────────────

function DailyChallengeCard({ todayActivity, myActiveJuz }: { todayActivity: any; myActiveJuz: any[] }) {
  const todayJuz   = todayActivity?.juzRead     ?? 0;
  const todayCoins = todayActivity?.coinsEarned ?? 0;
  const todayPages = todayActivity?.pagesRead   ?? 0;
  const hasJuz     = myActiveJuz.length > 0;
  const met        = todayJuz >= 1;

  return (
    <Card className={cn(
      "border-0 shadow-sm overflow-hidden",
      met ? "bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{met ? "🏆" : "🎯"}</span>
          <div>
            <p className="font-bold text-sm">Bugungi Vazifa</p>
            <p className="text-xs text-muted-foreground">
              {met ? "Bajarildi! Ertaga ham davom eting" : "Har kuni 1 pora o'qing"}
            </p>
          </div>
          {met && (
            <Badge variant="success" className="ml-auto text-xs">✓ Bajarildi</Badge>
          )}
        </div>

        <div className="space-y-2">
          {[
            {
              label:    "1 pora o'qing",
              done:     todayJuz >= 1,
              reward:   "+25 BuloqCoin",
              icon:     "📖",
            },
            {
              label:    "Tizimga kiring",
              done:     true,
              reward:   "+5 BuloqCoin",
              icon:     "☀️",
            },
          ].map((task) => (
            <div
              key={task.label}
              className={cn(
                "flex items-center gap-2.5 p-2.5 rounded-xl border transition-all",
                task.done
                  ? "bg-white border-emerald-200"
                  : "bg-gray-50 border-gray-100"
              )}
            >
              <span className="text-base shrink-0">{task.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-semibold",
                  task.done ? "text-gray-700 line-through opacity-60" : "text-gray-700"
                )}>
                  {task.label}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium">{task.reward}</p>
              </div>
              <span className="text-sm">
                {task.done ? "✅" : "⬜"}
              </span>
            </div>
          ))}
        </div>

        {/* Today summary */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-gray-200">
          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
            <span>📄 {todayPages} bet</span>
            <span>📖 {todayJuz} pora</span>
            <span className="text-yellow-600 font-semibold">🪙 +{todayCoins} coin</span>
          </div>
          {!hasJuz && !met && (
            <Button variant="emerald" size="sm" className="ml-auto h-7 text-xs" asChild>
              <Link href="/khatms">Pora olish</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── BuloqCoin Panel ──────────────────────────────────────────────────────────

function CoinPanel({ user, todayActivity }: { user: any; todayActivity: any }) {
  const coins      = user?.coins ?? 0;
  const todayCoins = todayActivity?.coinsEarned ?? 0;
  const level      = getUserLevel(coins);
  const nextLevel  = getNextLevel(coins);

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border border-yellow-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🪙</span>
          <div>
            <p className="font-bold text-sm text-yellow-800">BuloqCoin</p>
            <p className="text-xs text-yellow-600">Ajr ball tizimi</p>
          </div>
        </div>

        {/* Balance */}
        <div className="text-center py-3 bg-white/60 rounded-xl border border-yellow-100 mb-3">
          <p className="text-3xl font-black text-yellow-700">{coins.toLocaleString()}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Umumiy Balans</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-white/60 rounded-lg border border-yellow-100">
            <p className="text-lg font-bold text-emerald-600">
              {todayCoins > 0 ? `+${todayCoins}` : "+0"}
            </p>
            <p className="text-[10px] text-muted-foreground">Bugun topildi</p>
          </div>
          <div className="text-center p-2 bg-white/60 rounded-lg border border-yellow-100">
            <p className={cn("text-sm font-bold", level.color)}>{level.name}</p>
            <p className="text-[10px] text-muted-foreground">Hozirgi daraja</p>
          </div>
        </div>

        {nextLevel && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Keyingi: <span className="font-semibold">{nextLevel.name}</span></span>
              <span>{nextLevel.minPoints - coins} coin yetishmayapti</span>
            </div>
            <Progress value={getLevelProgress(coins)} className="h-1.5 bg-yellow-100" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Achievements ──────────────────────────────────────────────────────────────

function AchievementsCard({ myBadges }: { myBadges: any[] }) {
  const ALL_BADGES = Object.entries(BADGE_CONFIG);
  const earnedTypes = new Set(myBadges.map((b) => b.badge?.type));

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Award className="h-4 w-4 text-yellow-500" />
            Achievements
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {myBadges.length}/{ALL_BADGES.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {ALL_BADGES.map(([type, cfg]) => {
            const earned = earnedTypes.has(type as any);
            return (
              <div
                key={type}
                title={earned ? `✓ ${cfg.name}` : `🔒 ${cfg.name}`}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-default",
                  earned
                    ? "bg-yellow-50 border-yellow-200 shadow-sm"
                    : "bg-gray-50 border-gray-100 opacity-40 grayscale"
                )}
              >
                <span className="text-xl">{cfg.icon}</span>
                <p className={cn(
                  "text-[9px] font-semibold text-center leading-tight",
                  earned ? "text-yellow-700" : "text-gray-400"
                )}>
                  {cfg.name.split(" ").slice(0, 2).join(" ")}
                </p>
              </div>
            );
          })}
        </div>

        {myBadges.length === 0 && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            Xatmlarni yakunlab medallar yutib oling! 🏅
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Live Feed ────────────────────────────────────────────────────────────────

function LiveFeedCard({ feed }: { feed: any[] }) {
  if (feed.length === 0) return null;

  const FEED_ICONS: Record<string, string> = {
    JUZ_COMPLETED:     "📖",
    KHATM_PARTICIPANT: "🎉",
    KHATM_CREATOR:     "👑",
    DAILY_ACTIVITY:    "☀️",
    STREAK_7:          "🔥",
    STREAK_30:         "💎",
    REFERRAL:          "🤝",
    ADMIN_BONUS:       "⭐",
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-blue-500" />
          Jonli Faoliyat
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {feed.map((tx: any) => {
          const icon = FEED_ICONS[tx.reason] ?? "⭐";
          const name = [tx.user?.firstName, tx.user?.lastName].filter(Boolean).join(" ") || "Foydalanuvchi";
          const display = COIN_REASON_DISPLAY[tx.reason];

          return (
            <div key={tx.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 leading-none truncate">
                  {name}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {tx.description ?? display?.label ?? tx.reason}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-emerald-600">+{tx.amount}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(tx.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        <Button variant="ghost" size="sm" className="w-full h-7 text-xs mt-1" asChild>
          <Link href="/leaderboard">
            Barchasini ko'rish <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Leaderboard mini ─────────────────────────────────────────────────────────

function LeaderboardMini({ users, currentUserId }: { users: any[]; currentUserId: string }) {
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top Ishtirokchilar
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-xs p-0 text-emerald-600" asChild>
            <Link href="/leaderboard">Ko'proq →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1">
        {users.map((u, i) => {
          const isMe    = u.id === currentUserId;
          const level   = getUserLevel(u.coins ?? u.points ?? 0);
          const name    = [u.firstName, u.lastName].filter(Boolean).join(" ") || "Foydalanuvchi";
          return (
            <div
              key={u.id}
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-xl transition-colors",
                isMe
                  ? "bg-emerald-50 border border-emerald-200"
                  : "hover:bg-gray-50"
              )}
            >
              <span className="w-6 text-center text-sm shrink-0">
                {i < 3 ? medals[i] : <span className="text-xs text-muted-foreground">#{i + 1}</span>}
              </span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 font-bold">
                  {initials(u)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate leading-none">
                  {name} {isMe && <span className="text-emerald-500">(Men)</span>}
                </p>
                <p className={cn("text-[10px] font-medium mt-0.5", level.color)}>
                  {level.name}
                  {u.streakDays > 0 && (
                    <span className="text-orange-500 ml-1">🔥{u.streakDays}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-0.5 text-yellow-600 shrink-0">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-bold">{(u.coins ?? u.points ?? 0).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-xs text-center text-muted-foreground py-4">
            Hali ma'lumot yo'q
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Telegram Status ──────────────────────────────────────────────────────────

function TelegramStatus({ user }: { user: any }) {
  const linked     = !!user?.telegramId;
  const lastActive = user?.lastActiveAt;

  return (
    <Card className={cn(
      "border-0 shadow-sm",
      linked ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
            linked ? "bg-[#229ED9]" : "bg-gray-200"
          )}>
            <Bot className={cn("h-5 w-5", linked ? "text-white" : "text-gray-400")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Telegram</p>
            <p className={cn("text-xs", linked ? "text-blue-600" : "text-muted-foreground")}>
              {linked ? "✅ Ulangan" : "⚠️ Ulanmagan"}
            </p>
            {linked && lastActive && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Oxirgi: {formatRelativeTime(lastActive)}
              </p>
            )}
          </div>
          {!linked && (
            <Button variant="telegram" size="sm" className="h-7 text-xs" asChild>
              <Link href="/auth/signin">Ulash</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── My Active Juz ────────────────────────────────────────────────────────────

function MyJuzCard({ myActiveJuz }: { myActiveJuz: any[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            Mening Poralarim
            {myActiveJuz.length > 0 && (
              <Badge variant="success" className="text-[10px] py-0 ml-1">
                {myActiveJuz.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-xs p-0 text-emerald-600" asChild>
            <Link href="/khatms">Barchasi →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {myActiveJuz.length > 0 ? (
          <div className="space-y-2">
            {myActiveJuz.map((juz: any) => {
              const pagesRead = juz.progress?.pagesRead ?? 0;
              const totalPgs  = juz.progress?.totalPages ?? 20;
              const pct       = Math.round((pagesRead / totalPgs) * 100);
              return (
                <div
                  key={juz.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100"
                >
                  <div className="h-9 w-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{juz.juzNumber}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{juz.khatm?.title}</p>
                    <p className="text-[10px] text-muted-foreground">{JUZ_NAMES[juz.juzNumber]}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold shrink-0">
                        {pagesRead}/{totalPgs}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="emerald" className="h-7 text-xs shrink-0" asChild>
                    <Link href={`/khatms/${juz.khatmId}`}>→</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-3xl mb-1.5">📚</p>
            <p className="text-xs text-muted-foreground">Faol porangiz yo'q</p>
            <Button variant="emerald" size="sm" className="mt-2.5 h-7 text-xs" asChild>
              <Link href="/khatms">
                <Plus className="h-3 w-3 mr-1" />
                Pora olish
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Active Khatms ────────────────────────────────────────────────────────────

function ActiveKhatmsCard({ khatms }: { khatms: any[] }) {
  if (khatms.length === 0) return (
    <Card className="border-0 shadow-sm border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center py-8">
        <BookOpen className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-muted-foreground">Faol xatm yo'q</p>
        <Button variant="emerald" size="sm" className="mt-3" asChild>
          <Link href="/khatms/create"><Plus className="h-3.5 w-3.5 mr-1" />Xatm yaratish</Link>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-3">
      {khatms.map((khatm: any) => {
        const done    = khatm.juzList.length;
        const pct     = getKhatmProgress(done);
        return (
          <Card key={khatm.id} className="card-hover border-0 shadow-sm group overflow-hidden">
            <div className="h-1 gradient-emerald" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="font-bold text-sm truncate group-hover:text-emerald-600 transition-colors">
                  {khatm.title}
                </p>
                <Badge variant="active" className="text-[10px] shrink-0">Faol</Badge>
              </div>
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{done}/30 pora</span>
                  <span className="font-bold text-emerald-600">{pct}%</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {khatm._count.participations} kishi
                </span>
                <Button size="sm" variant="emerald" className="h-7 text-xs" asChild>
                  <Link href={`/khatms/${khatm.id}`}>Ko'rish</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Quick Actions Sidebar ────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: "+ Yangi Xatm",    href: "/khatms/create",  icon: Plus,   color: "bg-emerald-500 text-white" },
    { label: "🔍 Xatmga qo'shilish", href: "/khatms",    icon: Search, color: "bg-blue-500 text-white" },
    { label: "📖 Mening Poram",  href: "/khatms",         icon: BookOpen, color: "bg-amber-500 text-white" },
    { label: "🏆 Reyting",       href: "/leaderboard",    icon: Trophy, color: "bg-purple-500 text-white" },
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Tezkor Amallar
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {actions.map((a) => (
          <Link key={a.href + a.label} href={a.href}>
            <div className={cn(
              "flex items-center gap-2.5 p-2.5 rounded-xl text-sm font-semibold transition-all",
              "hover:-translate-y-0.5 hover:shadow-sm",
              a.color
            )}>
              <a.icon className="h-4 w-4 shrink-0" />
              {a.label}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardClient({
  session, user, global, myActiveJuz, recentKhatms,
  topUsers, todayActivity, recentFeed, myBadges,
}: Props) {
  return (
    <div className="space-y-4">

      {/* ── 1. Hero ── */}
      <HeroCard user={user} todayActivity={todayActivity} />

      {/* ── 2. Global Progress ── */}
      <GlobalProgressCard global={global} />

      {/* ── 3. Main Grid ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Left + Center (2/3) */}
        <div className="lg:col-span-2 space-y-4">

          {/* Daily Challenge */}
          <DailyChallengeCard todayActivity={todayActivity} myActiveJuz={myActiveJuz} />

          {/* My Juz */}
          <MyJuzCard myActiveJuz={myActiveJuz} />

          {/* Active Khatms */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Faol Xatmlar</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href="/khatms">Barchasi <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <ActiveKhatmsCard khatms={recentKhatms} />
          </div>

          {/* Achievements */}
          <AchievementsCard myBadges={myBadges} />
        </div>

        {/* Right (1/3) */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <QuickActions />

          {/* Coin Panel */}
          <CoinPanel user={user} todayActivity={todayActivity} />

          {/* Leaderboard */}
          <LeaderboardMini users={topUsers} currentUserId={session.user.id} />

          {/* Live Feed */}
          <LiveFeedCard feed={recentFeed} />

          {/* Telegram Status */}
          <TelegramStatus user={user} />
        </div>
      </div>
    </div>
  );
}
