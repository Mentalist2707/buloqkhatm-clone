"use client";

import {
  BarChart2, BookOpen, Library, Flame, Star,
  TrendingUp, Clock, Trophy, Award,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RTooltip, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getUserLevel, getNextLevel, getLevelProgress,
  formatRelativeTime, formatShortDate, COIN_REASON_DISPLAY, cn,
} from "@/lib/utils";

interface Props {
  user: any;
  dailyActivities: any[];
  recentCoins: any[];
  recentBookLogs: any[];
  completedKhatms: number;
  completedBooks: number;
}

export function StatsClient({
  user, dailyActivities, recentCoins, recentBookLogs,
  completedKhatms, completedBooks,
}: Props) {
  const coins     = user?.coins ?? 0;
  const level     = getUserLevel(coins);
  const nextLevel = getNextLevel(coins);
  const progress  = getLevelProgress(coins);

  // 14 kunlik grafik ma'lumoti
  const chartData = dailyActivities.map((d) => ({
    date:  formatShortDate(d.date),
    Quron: d.pagesRead ?? 0,
    Kitob: d.bookPages ?? 0,
  }));

  const summary = [
    { label: "O'qilgan betlar", value: user?.totalPagesRead ?? 0, icon: BookOpen,  color: "text-emerald-600 bg-emerald-100" },
    { label: "O'qilgan poralar", value: user?.totalJuzRead ?? 0,   icon: BookOpen,  color: "text-teal-600 bg-teal-100" },
    { label: "Yakunlangan xatm", value: completedKhatms,           icon: Trophy,    color: "text-blue-600 bg-blue-100" },
    { label: "O'qilgan kitob",   value: completedBooks,            icon: Library,   color: "text-purple-600 bg-purple-100" },
    { label: "Streak",           value: `${user?.streakDays ?? 0} kun`, icon: Flame, color: "text-orange-600 bg-orange-100" },
    { label: "BuloqCoin",        value: coins,                     icon: Star,      color: "text-yellow-600 bg-yellow-100" },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
          <BarChart2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistika</h1>
          <p className="text-muted-foreground text-sm">Shaxsiy o'qish natijalaringiz</p>
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Level progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Daraja
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">MAX 🏆</span>
            )}
          </div>
          {nextLevel && (
            <p className="text-xs text-center text-muted-foreground">
              <span className="font-semibold text-purple-600">{nextLevel.name}</span> uchun{" "}
              <span className="font-bold">{(nextLevel.minPoints - coins).toLocaleString()}</span> ball
            </p>
          )}
        </CardContent>
      </Card>

      {/* 14-day chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-emerald-600" />
            So'nggi 14 kun faolligi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    cursor={{ fill: "rgba(16,185,129,0.06)" }}
                  />
                  <Bar dataKey="Quron" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Kitob" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-center text-muted-foreground py-10">
              Hali faollik ma'lumoti yo'q
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Qur'on betlari</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Kitob betlari</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Coin history */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-600" />
              Ajr Ball Tarixi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentCoins.length > 0 ? recentCoins.map((tx: any) => {
              const d = COIN_REASON_DISPLAY[tx.reason];
              return (
                <div key={tx.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-sm shrink-0">
                    {d?.icon ?? "⭐"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{tx.description ?? d?.label ?? tx.reason}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{formatRelativeTime(tx.createdAt)}
                    </p>
                  </div>
                  <span className={cn("text-xs font-bold shrink-0", tx.amount > 0 ? "text-emerald-600" : "text-red-500")}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                  </span>
                </div>
              );
            }) : (
              <p className="text-sm text-center text-muted-foreground py-8">Hali ball tarixi yo'q</p>
            )}
          </CardContent>
        </Card>

        {/* Book reading history */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Library className="h-4 w-4 text-blue-600" />
              Kitob O'qish Tarixi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {recentBookLogs.length > 0 ? recentBookLogs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                <span className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-sm shrink-0">📖</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">{log.book?.title ?? "Kitob"}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{formatRelativeTime(log.date)}
                    {" · "}{log.fromPage}–{log.toPage} bet
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 shrink-0">+{log.pagesRead}</span>
              </div>
            )) : (
              <p className="text-sm text-center text-muted-foreground py-8">Hali kitob o'qish tarixi yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
