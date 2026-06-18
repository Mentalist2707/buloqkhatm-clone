"use client";

import { useState, useMemo } from "react";
import { Trophy, Star, Crown, Medal, Search, BookOpen, CheckCircle2, Flame, TrendingUp, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useDebounce } from "@/hooks/use-debounce";
import { getUserLevel, cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaderUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  username: string | null;
  photoUrl: string | null;
  image: string | null;
  coins: number;
  level: string;
  country: string | null;
  streakDays: number;
  _count: { participations: number };
  periodPoints?: number; // for weekly/monthly
}

type TabType = "alltime" | "monthly" | "weekly";

interface Props {
  allTime:         LeaderUser[];
  weekly:          (LeaderUser & { periodPoints: number })[];
  monthly:         (LeaderUser & { periodPoints: number })[];
  currentUserId:   string;
  currentUserRank: number;
  juzMap:          Record<string, number>;
  khatmMap:        Record<string, number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function displayName(u: LeaderUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.name || u.username || "Foydalanuvchi";
}

function avatarSrc(u: LeaderUser) {
  return u.photoUrl ?? u.image ?? "";
}

function initials(u: LeaderUser) {
  const n = displayName(u);
  return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const RANK_MEDAL: Record<number, { icon: string; bg: string; text: string; ring: string }> = {
  1: { icon: "🥇", bg: "bg-yellow-50",  text: "text-yellow-700", ring: "ring-yellow-400" },
  2: { icon: "🥈", bg: "bg-gray-50",    text: "text-gray-600",   ring: "ring-gray-300"  },
  3: { icon: "🥉", bg: "bg-orange-50",  text: "text-orange-600", ring: "ring-orange-300"},
};

// ─── Podium Component ─────────────────────────────────────────────────────────

function Podium({
  users,
  juzMap,
  khatmMap,
  currentUserId,
}: {
  users: LeaderUser[];
  juzMap: Record<string, number>;
  khatmMap: Record<string, number>;
  currentUserId: string;
}) {
  if (users.length < 3) return null;

  const order = [users[1], users[0], users[2]]; // 2nd, 1st, 3rd
  const heights = ["h-20", "h-28", "h-14"];       // podium column heights
  const sizes   = ["h-14 w-14", "h-20 w-20", "h-12 w-12"];
  const crowns  = ["🥈", "👑", "🥉"];
  const ranks   = [2, 1, 3];

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="gradient-emerald-dark px-6 pt-8 pb-0">
        <div className="flex items-end justify-center gap-4">
          {order.map((user, i) => {
            const isFirst   = ranks[i] === 1;
            const isMe      = user.id === currentUserId;
            const level     = getUserLevel(user.coins);
            const juzCount  = juzMap[user.id]  ?? 0;
            const khatmCount= khatmMap[user.id] ?? 0;

            return (
              <div key={user.id} className="flex flex-col items-center gap-1 pb-0">
                {/* Crown / medal */}
                <span className={cn("text-xl leading-none", isFirst && "animate-bounce-slow")}>
                  {crowns[i]}
                </span>

                {/* Avatar */}
                <div className={cn(
                  "relative rounded-full ring-4 ring-offset-2 ring-offset-transparent",
                  isMe ? "ring-white" : RANK_MEDAL[ranks[i]]?.ring ?? "ring-white/30"
                )}>
                  <Avatar className={cn(sizes[i], "border-2 border-white/50")}>
                    <AvatarImage src={avatarSrc(user)} />
                    <AvatarFallback className={cn(
                      "font-bold",
                      isFirst ? "text-base bg-yellow-100 text-yellow-700"
                              : "text-sm bg-white/20 text-white"
                    )}>
                      {initials(user)}
                    </AvatarFallback>
                  </Avatar>
                  {isMe && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                      ●
                    </span>
                  )}
                </div>

                {/* Name */}
                <p className={cn(
                  "text-white font-bold leading-none text-center max-w-[72px] truncate",
                  isFirst ? "text-sm" : "text-xs"
                )}>
                  {displayName(user).split(" ")[0]}
                </p>

                {/* Points */}
                <div className="flex items-center gap-1 mb-1">
                  <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                  <span className={cn("font-bold text-yellow-200", isFirst ? "text-sm" : "text-xs")}>
                    {user.coins.toLocaleString()}
                  </span>
                </div>

                {/* Podium column */}
                <div className={cn(
                  heights[i],
                  "w-20 rounded-t-xl flex items-start justify-center pt-2",
                  isFirst
                    ? "bg-yellow-400/30"
                    : ranks[i] === 2
                    ? "bg-white/10"
                    : "bg-white/10"
                )}>
                  <span className={cn(
                    "text-2xl font-black",
                    isFirst ? "text-yellow-300" : "text-white/60"
                  )}>
                    {ranks[i]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics row for top 3 */}
      <CardContent className="p-0">
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          {order.map((user, i) => {
            const juzCount   = juzMap[user.id]  ?? 0;
            const khatmCount = khatmMap[user.id] ?? 0;
            return (
              <div key={user.id} className={cn(
                "py-3 px-2 text-center",
                user.id === currentUserId && "bg-emerald-50"
              )}>
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {displayName(user).split(" ")[0]}
                </p>
                <div className="flex justify-center gap-2 mt-1">
                  <span className="text-[10px] text-emerald-600 font-medium">
                    📖 {juzCount}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">
                    ✓ {khatmCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  rank,
  isCurrentUser,
  juzCount,
  khatmCount,
  showPeriodPoints,
}: {
  user: LeaderUser;
  rank: number;
  isCurrentUser: boolean;
  juzCount: number;
  khatmCount: number;
  showPeriodPoints: boolean;
}) {
  const level  = getUserLevel(user.coins);
  const medal  = RANK_MEDAL[rank];
  const points = showPeriodPoints ? (user.periodPoints ?? 0) : user.coins;

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
      isCurrentUser
        ? "bg-emerald-50 border-l-4 border-l-emerald-400 border border-emerald-100 shadow-sm"
        : "hover:bg-gray-50 border border-transparent"
    )}>
      {/* Rank */}
      <div className="w-9 shrink-0 text-center">
        {medal ? (
          <span className="text-xl leading-none">{medal.icon}</span>
        ) : (
          <span className={cn(
            "text-sm font-bold",
            rank <= 10 ? "text-gray-600" : "text-gray-400"
          )}>
            #{rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className={cn(
        "h-10 w-10 shrink-0",
        isCurrentUser && "ring-2 ring-emerald-400 ring-offset-1"
      )}>
        <AvatarImage src={avatarSrc(user)} />
        <AvatarFallback className={cn(
          "text-sm font-bold",
          medal?.bg ?? "bg-gray-100",
          medal?.text ?? "text-gray-600"
        )}>
          {initials(user)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 truncate leading-none">
            {displayName(user)}
          </p>
          {isCurrentUser && (
            <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4">
              Men
            </Badge>
          )}
          {user.country && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {user.country}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <p className={cn("text-[11px] font-semibold", level.color)}>
            {level.name}
          </p>
          {user.streakDays > 0 && (
            <span className="text-[11px] text-orange-500 font-medium flex items-center gap-0.5">
              🔥 {user.streakDays}
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {juzCount > 0 && (
          <div className="text-center">
            <p className="text-xs font-bold text-emerald-600">{juzCount}</p>
            <p className="text-[10px] text-muted-foreground">pora</p>
          </div>
        )}
        {khatmCount > 0 && (
          <div className="text-center">
            <p className="text-xs font-bold text-blue-600">{khatmCount}</p>
            <p className="text-[10px] text-muted-foreground">xatm</p>
          </div>
        )}
      </div>

      {/* Points */}
      <div className="flex flex-col items-end shrink-0 ml-1">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-sm font-bold text-gray-800">
            {points.toLocaleString()}
          </span>
        </div>
        {showPeriodPoints && (
          <span className="text-[10px] text-emerald-500 font-medium">
            +{points} bu davr
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { key: TabType; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "alltime", label: "Umumiy",   icon: Trophy,   desc: "Barcha vaqt uchun TOP 100" },
  { key: "monthly", label: "Bu oy",    icon: TrendingUp, desc: "Joriy oy top o'quvchilari" },
  { key: "weekly",  label: "Bu hafta", icon: Flame,    desc: "Joriy hafta top o'quvchilari" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeaderboardClient({
  allTime,
  weekly,
  monthly,
  currentUserId,
  currentUserRank,
  juzMap,
  khatmMap,
}: Props) {
  const [tab, setTab] = useState<TabType>("alltime");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);

  // Active dataset
  const dataset: LeaderUser[] = useMemo(() => {
    if (tab === "weekly")  return weekly;
    if (tab === "monthly") return monthly;
    return allTime;
  }, [tab, allTime, weekly, monthly]);

  // Filtered by search
  const filtered = useMemo(() => {
    if (!debouncedSearch) return dataset;
    const q = debouncedSearch.toLowerCase();
    return dataset.filter((u) =>
      displayName(u).toLowerCase().includes(q) ||
      (u.username ?? "").toLowerCase().includes(q) ||
      (u.country  ?? "").toLowerCase().includes(q)
    );
  }, [dataset, debouncedSearch]);

  const showPeriodPoints = tab !== "alltime";
  const currentUserInList = allTime.findIndex((u) => u.id === currentUserId);

  // Summary stats
  const totalParticipants = allTime.length;
  const topLevel = allTime[0] ? getUserLevel(allTime[0].coins) : null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Header ── */}
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl gradient-emerald flex items-center justify-center shadow-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 text-lg animate-bounce-slow">⭐</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Reyting</h1>
        <p className="text-sm text-muted-foreground">
          {totalParticipants} ta o'quvchi • Eng faol Qur'on o'quvchilar
        </p>
      </div>

      {/* ── My rank card ── */}
      {currentUserInList >= 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-l-emerald-400">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-emerald flex items-center justify-center shadow-sm">
                  <Medal className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Mening o'rnim</p>
                  <p className="text-xs text-emerald-600">
                    {totalParticipants} ta ishtirokchi ichida
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-emerald-600 leading-none">
                  #{currentUserRank}
                </p>
                <p className="text-xs text-emerald-500 mt-0.5">
                  {allTime[0]?.coins
                    ? `Lidega ${(allTime[0].coins - (allTime[currentUserInList]?.coins ?? 0)).toLocaleString()} ball qoldi`
                    : ""}
                </p>
              </div>
            </div>

            {/* Progress to top */}
            {allTime[0] && currentUserInList > 0 && (() => {
              const myPts = allTime[currentUserInList]?.coins ?? 0;
              const topPts = allTime[0].coins;
              const pct = topPts > 0 ? Math.round((myPts / topPts) * 100) : 0;
              return (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-emerald-600 mb-1">
                    <span>Liderga nisbatan progress</span>
                    <span className="font-bold">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5 bg-emerald-100" />
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200",
                tab === t.key
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
              <span className="sm:hidden text-xs">{t.label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab description */}
      <p className="text-xs text-center text-muted-foreground -mt-2">
        {TABS.find((t) => t.key === tab)?.desc}
      </p>

      {/* ── Podium (alltime top 3) ── */}
      {tab === "alltime" && allTime.length >= 3 && !debouncedSearch && (
        <Podium
          users={allTime.slice(0, 3)}
          juzMap={juzMap}
          khatmMap={khatmMap}
          currentUserId={currentUserId}
        />
      )}

      {/* ── Search (alltime only) ── */}
      {tab === "alltime" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ism, username yoki mamlakat bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200"
          />
          {debouncedSearch && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── List ── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Header */}
        <CardHeader className="py-3 px-4 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>#</span>
              <span>Foydalanuvchi</span>
            </CardTitle>
            <div className="hidden sm:flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Pora
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Xatm
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" /> Ball
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 space-y-0.5">
          {filtered.length > 0 ? (
            filtered.map((user, index) => {
              // Rank: for filtered search, show original rank in allTime
              const originalRank = tab === "alltime"
                ? allTime.findIndex((u) => u.id === user.id) + 1
                : index + 1;

              return (
                <UserRow
                  key={user.id}
                  user={user}
                  rank={originalRank}
                  isCurrentUser={user.id === currentUserId}
                  juzCount={juzMap[user.id] ?? 0}
                  khatmCount={khatmMap[user.id] ?? 0}
                  showPeriodPoints={showPeriodPoints}
                />
              );
            })
          ) : (
            <div className="py-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Search className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {debouncedSearch
                  ? `"${debouncedSearch}" bo'yicha foydalanuvchi topilmadi`
                  : "Bu davrda faol foydalanuvchi yo'q"}
              </p>
              {debouncedSearch && (
                <button
                  onClick={() => setSearch("")}
                  className="text-xs text-emerald-600 hover:underline mt-1"
                >
                  Qidiruvni tozalash
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Stats summary ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Jami ishtirokchi",
            value: totalParticipants,
            icon: "👥",
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Top daraja",
            value: topLevel?.name ?? "—",
            icon: "👑",
            color: "bg-yellow-50 text-yellow-700",
          },
          {
            label: "Eng yuqori ball",
            value: (allTime[0]?.coins ?? 0).toLocaleString(),
            icon: "⭐",
            color: "bg-emerald-50 text-emerald-700",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className={cn("text-sm font-bold", s.color.split(" ")[1])}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Motivational footer ── */}
      <div className="text-center py-2">
        <p className="text-xs text-muted-foreground">
          Har kuni Qur'on o'qing — reytingda yuqorilang! 📖
        </p>
        <p className="arabic text-emerald-600 mt-1" style={{ fontSize: "13px" }}>
          وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا
        </p>
      </div>
    </div>
  );
}
