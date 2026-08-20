"use client";

import Link from "next/link";
import {
  BookOpen, ArrowRight,
  Trophy, Plus, Zap, TrendingUp,
  Award, ChevronRight, Library, Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  getUserLevel, getNextLevel, getLevelProgress,
  getKhatmProgress, JUZ_NAMES, formatRelativeTime,
  BADGE_CONFIG, COIN_REASON_DISPLAY, cn,
} from "@/lib/utils";
import { computeBookPlan } from "@/lib/books";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId:        string;
  user:          any;
  stats: {
    juzCompleted:    number;
    juzTotal:        number;
    activeKhatms:    number;
    completedKhatms: number;
  };
  myActiveJuz:   any[];
  recentKhatms:  any[];
  todayActivity: any | null;
  recentFeed:    any[];
  myBadges:      any[];
  readingBooks:  any[];
}

function initials(u: any) {
  const n = [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.name || "Men";
  return n.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Hero Card ────────────────────────────────────────────────────────────────

function HeroCard({ user, todayActivity }: { user: any; todayActivity: any }) {
  const coins      = user?.coins ?? 0;
  const streak     = user?.streakDays ?? 0;
  const totalJuz   = user?.totalJuzRead ?? 0;
  const totalBooks = user?.totalBooksRead ?? 0;
  const level      = getUserLevel(coins);
  const nextLevel  = getNextLevel(coins);
  const lvlProgress = getLevelProgress(coins);

  const todayPages = todayActivity?.pagesRead   ?? 0;
  const todayJuz   = todayActivity?.juzRead     ?? 0;
  const dailyGoalMet = todayJuz >= 1 || (todayActivity?.bookPages ?? 0) > 0;

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ")
            || user?.name || "Aziz do'st";

  return (
    <div className="relative overflow-hidden rounded-2xl gradient-emerald-dark text-white shadow-xl">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-0 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute left-1/3 top-0 h-24 w-24 rounded-full bg-emerald-400/10" />
      </div>

      <div className="relative z-10 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-emerald-200 text-sm font-medium">Assalomu alaykum,</p>
            <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">{name} 👋</h1>
            <p className="text-emerald-200 text-xs mt-1">
              {dailyGoalMet
                ? "🎉 Bugun ham o'qidingiz! Barakalla"
                : "📖 Bugun Qur'on va kitob o'qishni davom ettiring"}
            </p>
          </div>
          <Avatar className="h-14 w-14 border-2 border-white/30 shadow-lg shrink-0">
            <AvatarFallback className="text-lg bg-white/20 text-white font-extrabold">
              {initials(user)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            { icon: "📖", label: "Pora",      value: totalJuz },
            { icon: "📚", label: "Kitob",     value: totalBooks },
            { icon: "🪙", label: "BuloqCoin", value: coins },
            { icon: "🔥", label: "Streak",    value: `${streak} kun` },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl px-3 py-2.5 text-center">
              <p className="text-xl leading-none">{s.icon}</p>
              <p className="text-lg font-black leading-none mt-1">{s.value}</p>
              <p className="text-[10px] text-white/70 mt-0.5 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Daraja: <span className="font-bold">{level.name}</span>
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
          <div className="flex justify-between text-[10px] text-white/60 mt-1">
            <span>Bugun: {todayPages} bet Qur'on</span>
            <span>Bugun: {todayActivity?.bookPages ?? 0} bet kitob</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── My progress card ─────────────────────────────────────────────────────────

function MyProgressCard({ stats }: { stats: Props["stats"] }) {
  const pct = stats.juzTotal > 0
    ? Math.round((stats.juzCompleted / stats.juzTotal) * 100)
    : 0;

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <div className="h-1 w-full gradient-emerald" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-sm">Xatm Progressim</p>
              <p className="text-xs text-muted-foreground">
                Barcha xatmlaringizdagi umumiy holat
              </p>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600">{pct}%</span>
        </div>

        <div className="space-y-1.5">
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full gradient-emerald rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-emerald-600">
              {stats.juzCompleted} pora o'qildi
            </span>
            <span>{stats.juzTotal} ta jami pora</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { label: "Faol Xatm",   value: stats.activeKhatms,    icon: "📖" },
            { label: "Yakunlangan", value: stats.completedKhatms, icon: "✅" },
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

// ─── Reading books card ─────────────────────────────────────────────────────────

function ReadingBooksCard({ books }: { books: any[] }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Library className="h-4 w-4 text-blue-500" />
            O'qilayotgan Kitoblar
            {books.length > 0 && (
              <Badge className="text-[10px] py-0 ml-1 bg-blue-100 text-blue-700 border-0">
                {books.length}
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 text-xs p-0 text-blue-600" asChild>
            <Link href="/books">Barchasi →</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {books.length > 0 ? (
          <div className="space-y-2">
            {books.map((book: any) => {
              const plan = computeBookPlan(book);
              return (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-colors"
                >
                  <div className="h-12 w-9 rounded-md bg-blue-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {book.coverUrl
                      ? <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                      : <BookOpen className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{book.title}</p>
                    {book.author && (
                      <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${plan.percent}%` }} />
                      </div>
                      <span className="text-[10px] text-blue-700 font-bold shrink-0">
                        {plan.currentPage}/{plan.totalPages}
                      </span>
                    </div>
                    <p className="text-[10px] mt-1 font-medium flex items-center gap-1">
                      <Target className="h-2.5 w-2.5" />
                      <span className={plan.onTrack ? "text-emerald-600" : "text-orange-600"}>
                        Bugun {plan.todayTarget} bet o'qing
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5">
            <p className="text-3xl mb-1.5">📚</p>
            <p className="text-xs text-muted-foreground">Hozircha kitob rejasi yo'q</p>
            <Button variant="emerald" size="sm" className="mt-2.5 h-7 text-xs" asChild>
              <Link href="/books/create">
                <Plus className="h-3 w-3 mr-1" />
                Kitob qo'shish
              </Link>
            </Button>
          </div>
        )}
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
              <span>{nextLevel.minPoints - coins} coin</span>
            </div>
            <Progress value={getLevelProgress(coins)} className="h-1.5 bg-yellow-100" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Achievements ──────────────────────────────────────────────────────────────

function AchievementsCard({ myBadges, user }: { myBadges: any[]; user: any }) {
  const ALL_BADGES = Object.entries(BADGE_CONFIG);
  const earnedTypes = new Set(myBadges.map((b) => b.badge?.type));

  const statOf = (type: string): number => {
    if (type.startsWith("KHATM_CREATOR")) return 0;
    if (type.startsWith("KHATM"))  return user?.totalKhatms ?? 0;
    if (type.startsWith("STREAK")) return user?.streakDays ?? 0;
    if (type.startsWith("BOOK_PAGES")) return user?.totalBookPagesRead ?? 0;
    if (type.startsWith("BOOK"))   return user?.totalBooksRead ?? 0;
    if (type.startsWith("JUZ"))    return user?.totalJuzRead ?? 0;
    if (type.startsWith("PAGES"))  return user?.totalPagesRead ?? 0;
    if (type.startsWith("ACTIVE")) return 0;
    if (type.startsWith("COINS"))  return user?.coins ?? 0;
    return 0;
  };

  const sortFn = ([ta]: [string, any], [tb]: [string, any]) => {
    const ae = earnedTypes.has(ta as any) ? 1 : 0;
    const be = earnedTypes.has(tb as any) ? 1 : 0;
    if (ae !== be) return be - ae;
    return statOf(tb) - statOf(ta);
  };

  const quron = ALL_BADGES.filter(([, c]) => c.category === "QURON").sort(sortFn).slice(0, 10);
  const kitob = ALL_BADGES.filter(([, c]) => c.category === "KITOB").sort(sortFn).slice(0, 10);

  const renderRow = ([type, cfg]: [string, any]) => {
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
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Award className="h-4 w-4 text-yellow-500" />
            Medallar
          </CardTitle>
          <Link href="/profile" className="text-xs font-medium text-emerald-600 hover:underline">
            {myBadges.length}/{ALL_BADGES.length} • Barchasi
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <div>
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">🕌 Qur'on Yutuqlari</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {quron.map(renderRow)}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2">📚 Kitob Yutuqlari</p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {kitob.map(renderRow)}
          </div>
        </div>
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
    BOOK_COMPLETED:    "📚",
    DAILY_ACTIVITY:    "☀️",
    STREAK_7:          "🔥",
    STREAK_30:         "💎",
    ADMIN_BONUS:       "⭐",
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-blue-500" />
          So'nggi Faoliyat
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {feed.map((tx: any) => {
          const icon = FEED_ICONS[tx.reason] ?? "⭐";
          const display = COIN_REASON_DISPLAY[tx.reason];

          return (
            <div key={tx.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 leading-none truncate">
                  {tx.description ?? display?.label ?? tx.reason}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatRelativeTime(tx.createdAt)}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 shrink-0">+{tx.amount}</span>
            </div>
          );
        })}
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs mt-1" asChild>
          <Link href="/leaderboard">
            Statistika <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
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
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
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
        const done = khatm.juzList.length;
        const pct  = getKhatmProgress(done);
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
              <div className="flex items-center justify-end">
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

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: "Yangi Xatm",   href: "/khatms/create", icon: Plus,    color: "bg-emerald-500 text-white" },
    { label: "Yangi Kitob",  href: "/books/create",  icon: Library, color: "bg-blue-500 text-white" },
    { label: "Statistika",   href: "/leaderboard",   icon: Trophy,  color: "bg-purple-500 text-white" },
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
  user, stats, myActiveJuz, recentKhatms,
  todayActivity, recentFeed, myBadges, readingBooks,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <HeroCard user={user} todayActivity={todayActivity} />

      {/* My progress */}
      <MyProgressCard stats={stats} />

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left + Center (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <ReadingBooksCard books={readingBooks} />

          <MyJuzCard myActiveJuz={myActiveJuz} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Faol Xatmlar</h2>
              <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                <Link href="/khatms">Barchasi <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <ActiveKhatmsCard khatms={recentKhatms} />
          </div>

          <AchievementsCard myBadges={myBadges} user={user} />
        </div>

        {/* Right (1/3) */}
        <div className="space-y-4">
          <QuickActions />
          <CoinPanel user={user} todayActivity={todayActivity} />
          <LiveFeedCard feed={recentFeed} />
        </div>
      </div>
    </div>
  );
}
