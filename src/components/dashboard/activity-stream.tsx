"use client";

import { useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COIN_REASON_DISPLAY, formatRelativeTime, cn } from "@/lib/utils";

interface CoinTx {
  id:          string;
  amount:      number;
  reason:      string;
  description: string | null;
  createdAt:   string;
  metadata:    any;
}

interface DailyActivity {
  date:        string;
  pagesRead:   number;
  juzRead:     number;
  coinsEarned: number;
}

// ─── Week bar chart ───────────────────────────────────────────────────────────

function WeekChart({ weekActivity }: { weekActivity: DailyActivity[] }) {
  const days = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
  const today = new Date();
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;

  // Build 7-day array
  const slots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    d.setUTCHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split("T")[0];
    const activity = weekActivity.find((a) => {
      const aDate = new Date(a.date).toISOString().split("T")[0];
      return aDate === dateStr;
    });
    return {
      day:         days[d.getDay() === 0 ? 6 : d.getDay() - 1],
      isToday:     i === 6,
      pagesRead:   activity?.pagesRead   ?? 0,
      coinsEarned: activity?.coinsEarned ?? 0,
    };
  });

  const maxPages = Math.max(...slots.map((s) => s.pagesRead), 1);

  return (
    <div className="flex items-end justify-between gap-1 h-20 px-1">
      {slots.map((slot, i) => {
        const height = Math.max(4, Math.round((slot.pagesRead / maxPages) * 64));
        const hasActivity = slot.pagesRead > 0;
        return (
          <div
            key={i}
            className="flex flex-col items-center gap-1 flex-1"
            title={`${slot.pagesRead} bet, ${slot.coinsEarned} coin`}
          >
            {/* Coin label */}
            {slot.coinsEarned > 0 && (
              <span className="text-[9px] font-bold text-yellow-500">
                +{slot.coinsEarned}
              </span>
            )}
            {/* Bar */}
            <div className="w-full flex items-end justify-center">
              <div
                className={cn(
                  "w-full rounded-t-lg transition-all duration-500",
                  slot.isToday
                    ? hasActivity ? "bg-emerald-500" : "bg-emerald-200"
                    : hasActivity ? "bg-emerald-300" : "bg-gray-100"
                )}
                style={{ height: `${height}px` }}
              />
            </div>
            {/* Day label */}
            <span className={cn(
              "text-[10px] font-semibold",
              slot.isToday ? "text-emerald-600" : "text-gray-400"
            )}>
              {slot.isToday ? "Bug" : slot.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Today Stats ──────────────────────────────────────────────────────────────

function TodayStats({ today }: { today: DailyActivity | null }) {
  const pagesRead   = today?.pagesRead   ?? 0;
  const juzRead     = today?.juzRead     ?? 0;
  const coinsEarned = today?.coinsEarned ?? 0;

  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Bet o'qildi", value: pagesRead,   icon: "📄", color: "bg-blue-50   text-blue-700"   },
        { label: "Pora o'qildi",value: juzRead,     icon: "📖", color: "bg-emerald-50 text-emerald-700"},
        { label: "Coin topildi",value: coinsEarned, icon: "🪙", color: "bg-yellow-50 text-yellow-700" },
      ].map((s) => (
        <div
          key={s.label}
          className={cn("rounded-xl p-2.5 text-center", s.color)}
        >
          <p className="text-lg">{s.icon}</p>
          <p className="text-lg font-black leading-none mt-0.5">{s.value}</p>
          <p className="text-[10px] font-medium mt-0.5 opacity-80 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Coin Transaction Row ─────────────────────────────────────────────────────

function CoinRow({ tx }: { tx: CoinTx }) {
  const display = COIN_REASON_DISPLAY[tx.reason] ?? {
    icon: "⭐", label: tx.reason, color: "text-gray-600",
  };
  const isPositive = tx.amount > 0;

  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-base">
        {display.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate leading-none">
          {tx.description ?? display.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatRelativeTime(tx.createdAt)}
        </p>
      </div>
      <span className={cn(
        "text-sm font-extrabold shrink-0",
        isPositive ? "text-emerald-600" : "text-red-500"
      )}>
        {isPositive ? "+" : ""}{tx.amount}
        <span className="text-[10px] text-muted-foreground ml-0.5">coin</span>
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ActivityStream() {
  const [loading,      setLoading]      = useState(true);
  const [weekActivity, setWeekActivity] = useState<DailyActivity[]>([]);
  const [todayData,    setTodayData]    = useState<DailyActivity | null>(null);
  const [recentCoins,  setRecentCoins]  = useState<CoinTx[]>([]);

  useEffect(() => {
    fetch("/api/users/activity")
      .then((r) => r.json())
      .then((d) => {
        setWeekActivity(d.weekActivity ?? []);
        setTodayData(d.todayActivity   ?? null);
        setRecentCoins(d.recentCoins   ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today stats */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="text-base">☀️</span>
            Bugungi Faollik
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <TodayStats today={todayData} />

          {/* Week chart */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Haftalik o'qish grafigi
            </p>
            <WeekChart weekActivity={weekActivity} />
          </div>
        </CardContent>
      </Card>

      {/* Activity stream */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            So'nggi BuloqCoin Faoliyati
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentCoins.length > 0 ? (
            <div>
              {recentCoins.map((tx) => (
                <CoinRow key={tx.id} tx={tx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">🪙</p>
              <p className="text-xs text-muted-foreground">
                Hali faollik yo'q. Bugun pora o'qing!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
